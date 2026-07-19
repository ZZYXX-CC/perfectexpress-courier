import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { generateTrackingNumber } from './shipmentUtils';
import { emailService } from './emailService';

export interface ShipmentData {
    sender_info: {
        name: string;
        email: string;
        address: string;
        phone: string;
    };
    receiver_info: {
        name: string;
        email: string;
        address: string;
        phone: string;
    };
    parcel_details: {
        description: string;
        weight: string;
        quantity: string;
        type: string;
    };
}

export { generateTrackingNumber };

export const createShipment = async (data: ShipmentData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be logged in to create a shipment' };

    const trackingNumber = generateTrackingNumber();

    // Extract city from address or fallback. Guard against a missing/blank
    // address so we never throw before the shipment is even created.
    const senderAddress = data.sender_info?.address || '';
    const cityMatch = senderAddress.match(/[a-zA-Z\u00C0-\u00FF\s]+(?=,|$)/);
    const originCity = cityMatch ? cityMatch[0].trim() : 'Central';
    const initialLocation = `${originCity} Logistics Center`;

    // Default initial status
    const initialStatus = 'pending';

    const { data: shipment, error } = await supabase
        .from('shipments')
        .insert({
            user_id: user.id,
            tracking_number: trackingNumber,
            sender_info: data.sender_info,
            receiver_info: data.receiver_info,
            parcel_details: data.parcel_details,
            status: initialStatus,
            payment_status: 'unpaid',
            current_location: initialLocation,
            history: [
                {
                    status: initialStatus,
                    location: initialLocation,
                    note: 'Shipment created and processing at origin facility.',
                    timestamp: new Date().toISOString()
                }
            ]
        })
        .select()
        .single();

    if (error || !shipment) {
        console.error('Error creating shipment:', error);
        return { error: 'Failed to create shipment. Please try again.' };
    }

    // Best-effort side effects. The shipment row already exists at this point,
    // so a notification/email/RLS failure must NEVER surface to the customer as
    // a failed submit (which also caused silent duplicate shipments on retry).
    try {
        // Trigger Notifications (Sender + Admins)
        await notificationService.sendNewShipmentNotifications(shipment);

        // Receiver Notifications (Email + In-App if receiver is a user)
        const receiverEmail = data.receiver_info?.email?.trim();
        const senderName = data.sender_info?.name || 'PerfectExpress Customer';
        if (receiverEmail && receiverEmail.toLowerCase() !== (data.sender_info?.email || '').trim().toLowerCase()) {
            // Receiver in-app notification is created server-side by the
            // trg_notify_on_shipment_insert trigger (RLS blocks cross-user inserts
            // from the browser). The email below is fine to send client-side.
            await emailService.sendEmail({
                to: receiverEmail,
                ...emailService.templates.receiverShipmentNotification(
                    trackingNumber,
                    data.receiver_info?.name || 'Customer',
                    senderName
                )
            });
        }
    } catch (sideEffectError) {
        console.error('Post-shipment notification/email failed (shipment was still created):', sideEffectError);
    }

    return { success: true, trackingNumber: shipment.tracking_number };
};
