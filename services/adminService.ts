import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { emailService } from './emailService';

// Types
export interface ShipmentUpdate {
    status?: string;
    payment_status?: string;
    current_location?: string;
    price?: number;
    created_at?: string;
    sender_info?: Record<string, unknown>;
    receiver_info?: Record<string, unknown>;
    parcel_details?: Record<string, unknown>;
}

export interface ShipmentEvent {
    status: string;
    location: string;
    note?: string;
    timestamp?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'client' | 'admin';
    created_at: string;
}

// Get all shipments for admin
export const getAllShipments = async (limit: number = 100) => {
    const { data, error } = await supabase
        .from('shipments')
        .select('id, tracking_number, sender_info, receiver_info, parcel_details, status, payment_status, current_location, history, created_at, price')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return [];

    return data;
};

// Update shipment status/payment/location
export const updateShipment = async (trackingNumber: string, updates: ShipmentUpdate) => {
    // Auto-update payment status if status becomes confirmed
    if (updates.status === 'confirmed') {
        updates.payment_status = 'paid';
    }

    const { error } = await supabase
        .from('shipments')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('tracking_number', trackingNumber);

    if (error) return { error: `Failed to update shipment: ${error.message}` };

    // Trigger notification for shipment owner
    if (updates.status || updates.payment_status) {
        const { data: ship } = await supabase.from('shipments').select('user_id').eq('tracking_number', trackingNumber).single();
        if (ship?.user_id) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const impersonatedId = localStorage.getItem('impersonated_user_id');
            const actorId = currentUser?.id;

            if (ship.user_id !== actorId || impersonatedId) {
                await notificationService.createNotification({
                    user_id: ship.user_id,
                    type: updates.payment_status && !updates.status ? 'payment_update' : 'shipment_update',
                    title: updates.status ? 'Shipment Updated' : 'Payment Received',
                    message: updates.status
                        ? `Your shipment ${trackingNumber} is now ${updates.status.toUpperCase()}.`
                        : `Payment for shipment ${trackingNumber} has been verified.`,
                    link: `/track/${trackingNumber}`
                });

                if (updates.status) {
                    const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', ship.user_id).single();
                    if (userProfile) {
                        await emailService.sendEmail({
                            to: userProfile.email,
                            ...emailService.templates.statusUpdate(trackingNumber, updates.status)
                        });
                    }
                }
            }
        }
    }

    return { success: true };
};

// Log a new event to shipment history
export const logShipmentEvent = async (
    trackingNumber: string,
    event: ShipmentEvent,
    _notifyUser: boolean = false
) => {
    // First, get the current shipment to access history
    const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

    if (fetchError || !shipment) return { error: 'Failed to fetch shipment' };

    const currentHistory = (shipment.history as ShipmentEvent[]) || [];

    // Deduplication check: Don't add if status and location are the same as last entry
    const lastEvent = currentHistory[currentHistory.length - 1];
    if (lastEvent && lastEvent.status === event.status && lastEvent.location === event.location) {
        return { success: true };
    }

    const newEvent: ShipmentEvent = {
        ...event,
        timestamp: new Date().toISOString()
    };
    const updatedHistory = [...currentHistory, newEvent];

    // Build update object
    const updateData: Record<string, unknown> = {
        status: event.status,
        current_location: event.location,
        history: updatedHistory,
        updated_at: new Date().toISOString()
    };

    // Auto-update payment status if status becomes confirmed
    if (event.status === 'confirmed') {
        updateData.payment_status = 'paid';
    }

    const { error: updateError } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('tracking_number', trackingNumber);

    if (updateError) return { error: 'Failed to log event' };

    // Trigger notification
    if (shipment.user_id) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (shipment.user_id !== currentUser?.id) {
            const { error: notifError } = await notificationService.createNotification({
                user_id: shipment.user_id,
                type: 'shipment_update',
                title: 'Shipment Movement',
                message: `New update for ${trackingNumber}: ${event.status.toUpperCase()} at ${event.location}.`,
                link: `/track/${trackingNumber}`
            });
        }
    }

    return { success: true };
};

// Toggle payment status
export const togglePaymentStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    return updateShipment(id, { payment_status: newStatus });
};

// Delete a shipment
export const deleteShipment = async (trackingNumber: string) => {
    const { data, error } = await supabase
        .from('shipments')
        .delete()
        .eq('tracking_number', trackingNumber)
        .select('id');

    if (error) return { error: `Failed to delete shipment: ${error.message}` };
    if (!data || data.length === 0) return { error: 'Delete blocked by permissions. You may not have admin privileges.' };

    return { success: true };
};

// --- User Management ---

export const getAllUsers = async (limit: number = 100): Promise<UserProfile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at, phone, company, address')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return [];

    return data as UserProfile[];
};

// Update user role (Note: May require service role for full functionality)
export const updateUserRole = async (userId: string, newRole: 'client' | 'admin') => {
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) return { error: 'Failed to update user role' };

    await notificationService.createNotification({
        user_id: userId,
        type: 'system',
        title: 'Account Role Updated',
        message: `Your account role has been changed to ${newRole.toUpperCase()}. ${newRole === 'admin' ? 'You now have administrative access.' : 'Your admin privileges have been revoked.'}`,
        link: '/dashboard'
    });

    return { success: true };
};

// Invite a user with a specific role
export const inviteUser = async (email: string, role: 'client' | 'admin') => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
        .from('user_invites')
        .upsert({
            email,
            role,
            invited_by: user.id,
            created_at: new Date().toISOString()
        });

    if (error) return { error: 'Failed to invite user' };

    return { success: true };
};
