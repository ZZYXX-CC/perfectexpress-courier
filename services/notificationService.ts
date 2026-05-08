import { supabase } from './supabase';
import { emailService } from './emailService';
import { getActiveUserId } from './authGuard';

export interface Notification {
    id: string;
    user_id: string;
    type: 'shipment_update' | 'ticket_reply' | 'chat_message' | 'payment_update' | 'system';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export interface ProfileSummary {
    id: string;
    email: string;
    full_name?: string | null;
}

export const notificationService = {
    async findProfileByEmail(email: string): Promise<ProfileSummary | null> {
        const normalized = (email || '').trim().toLowerCase();
        if (!normalized) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .ilike('email', normalized)
            .maybeSingle();

        if (error) return null;

        return data as ProfileSummary | null;
    },

    async fetchNotifications() {
        const activeUserId = await getActiveUserId();

        if (!activeUserId) return { data: [], error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('notifications')
            .select('id, user_id, type, title, message, link, is_read, created_at')
            .eq('user_id', activeUserId)
            .order('created_at', { ascending: false })
            .limit(50);

        return { data: data as Notification[], error };
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        return { error };
    },

    async markAllAsRead() {
        const activeUserId = await getActiveUserId();

        if (!activeUserId) return { error: 'Not authenticated' };

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', activeUserId)
            .eq('is_read', false);
        return { error };
    },

    async createNotification(notification: Omit<Notification, 'id' | 'is_read' | 'created_at'>) {
        const { data, error } = await supabase
            .from('notifications')
            .insert([notification])
            .select()
            .single();
        return { data: data as Notification, error };
    },

    async notifyUserByEmail(email: string, payload: Omit<Notification, 'id' | 'is_read' | 'created_at' | 'user_id'>) {
        const profile = await this.findProfileByEmail(email);
        if (!profile) return { error: 'User not found for email' };

        return this.createNotification({
            user_id: profile.id,
            ...payload
        });
    },

    async notifyAdmins(title: string, message: string, link?: string) {
        const { data: admins } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('role', 'admin');

        if (!admins) return;

        for (const admin of admins) {
            await this.createNotification({
                user_id: admin.id,
                type: 'system',
                title,
                message,
                link
            });

            // Trigger Email (Conceptual log in dev)
            await emailService.sendEmail({
                to: admin.email,
                ...emailService.templates.adminNewShipmentAlert(link?.split('/').pop() || 'N/A', 'A Customer')
            });
        }
    },

    async sendNewShipmentNotifications(shipment: any) {
        if (!shipment?.tracking_number) return;

        // 1. Notify User (In-App)
        if (shipment.user_id) {
            await this.createNotification({
                user_id: shipment.user_id,
                type: 'shipment_update',
                title: 'Shipment Registered',
                message: `Your shipment ${shipment.tracking_number} has been successfully created.`,
                link: `/track/${shipment.tracking_number}`
            });
        }

        // 2. Notify User (Email)
        if (shipment.user_id) {
            const { data: userProfile } = await supabase.from('profiles').select('email, full_name').eq('id', shipment.user_id).single();
            if (userProfile) {
                await emailService.sendEmail({
                    to: userProfile.email,
                    ...emailService.templates.shipmentConfirmation(shipment.tracking_number, userProfile.full_name)
                });
            }
        }

        // 3. Notify Admins
        await this.notifyAdmins(
            'New Shipment Alert',
            `A new shipment (${shipment.tracking_number}) has been submitted. Check details.`,
            `/dashboard?tab=shipments`
        );
    }
};
