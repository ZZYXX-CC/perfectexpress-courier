import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { emailService } from './emailService';

export interface SupportTicket {
    id: string;
    ticket_number: string;
    user_id: string | null;
    name: string;
    email: string;
    subject: string;
    message?: string; // Optional in list view
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
}

export interface TicketReply {
    id: string;
    ticket_id: string;
    sender_type: 'customer' | 'admin';
    sender_name: string | null;
    message: string;
    created_at: string;
}

export const generateTicketNumber = () => {
    return `TKT-${Math.floor(10000000 + Math.random() * 90000000)}`;
};

export const createTicket = async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    userId?: string;
}) => {
    const { data: { user } } = await supabase.auth.getUser();
    const safeUserId = user && data.userId === user.id ? user.id : null;
    const ticketNumber = generateTicketNumber();

    // Create the ticket through a SECURITY DEFINER RPC so public support
    // submissions do not depend on direct browser INSERT policies.
    const { data: ticket, error: ticketError } = await supabase
        .rpc('create_support_ticket', {
            p_ticket_number: ticketNumber,
            p_name: data.name,
            p_email: data.email,
            p_subject: data.subject,
            p_message: data.message,
            p_user_id: safeUserId
        })
        .single();

    if (ticketError) return { error: ticketError.message };

    // 3. Notify the ticket creator (confirmation)
    if (safeUserId) {
        await notificationService.createNotification({
            user_id: safeUserId,
            type: 'ticket_reply',
            title: 'Ticket Submitted',
            message: `Your support ticket ${ticketNumber} ("${data.subject}") has been received. Our team will respond shortly.`,
            link: `/dashboard/tickets/${ticket.id}`
        });
    }

    // 4. Notify Admins
    await notificationService.notifyAdmins(
        'New Support Ticket',
        `A new ticket (${ticketNumber}) has been created by ${data.name}: ${data.subject}`,
        `/dashboard?tab=support`
    );

    return { success: true, ticket };
};

export const getUserTickets = async (userId: string) => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('id, ticket_number, user_id, name, email, subject, status, priority, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupportTicket[];
};

export const getAllTickets = async () => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('id, ticket_number, user_id, name, email, subject, status, priority, created_at, updated_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupportTicket[];
}

export const getTicketDetails = async (ticketId: string) => {
    const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('id, ticket_number, user_id, name, email, subject, status, priority, created_at, updated_at')
        .eq('id', ticketId)
        .single();

    if (ticketError) throw ticketError;

    const { data: replies, error: replyError } = await supabase
        .from('ticket_replies')
        .select('id, ticket_id, sender_type, sender_name, message, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    if (replyError) throw replyError;

    return { ticket, replies: replies as TicketReply[] };
};

export const addReply = async (ticketId: string, message: string, senderType: 'customer' | 'admin', senderName: string) => {
    const { data, error } = await supabase
        .from('ticket_replies')
        .insert({
            ticket_id: ticketId,
            sender_type: senderType,
            sender_name: senderName,
            message
        })
        .select()
        .single();

    if (error) throw error;

    // Trigger notification if admin replies to customer
    if (senderType === 'admin') {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const { data: ticket } = await supabase.from('support_tickets').select('user_id, ticket_number').eq('id', ticketId).single();
        if (ticket?.user_id && ticket.user_id !== currentUser?.id) {
            const { error: notifError } = await notificationService.createNotification({
                user_id: ticket.user_id,
                type: 'ticket_reply',
                title: 'New Support Signal',
                message: `Agent ${senderName} replied to ticket ${ticket.ticket_number}.`,
                link: `/dashboard/tickets/${ticketId}`
            });

            // Email Notification
            const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', ticket.user_id).single();
            if (userProfile) {
                await emailService.sendEmail({
                    to: userProfile.email,
                    ...emailService.templates.supportReply(ticket.ticket_number, message)
                });
            }

        }
    } else {
        // Trigger notification for ALL admins when a customer replies
        const { data: ticket } = await supabase.from('support_tickets').select('ticket_number').eq('id', ticketId).single();
        const ticketLabel = ticket?.ticket_number || ticketId;
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        if (admins) {
            for (const admin of admins) {
                await notificationService.createNotification({
                    user_id: admin.id,
                    type: 'ticket_reply',
                    title: 'Customer Response',
                    message: `${senderName} replied to ticket ${ticketLabel}.`,
                    link: `/dashboard/tickets/${ticketId}`
                });

                const { data: adminProfile } = await supabase.from('profiles').select('email').eq('id', admin.id).single();
                if (adminProfile) {
                    await emailService.sendEmail({
                        to: adminProfile.email,
                        ...emailService.templates.supportReply(ticketLabel, message)
                    });
                }
            }
        }
    }

    return data;
};

export const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const { data, error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

    if (error) throw error;

    // Trigger notification if status changes
    if (data.user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (data.user_id !== user?.id) {
            await notificationService.createNotification({
                user_id: data.user_id,
                type: 'ticket_reply',
                title: 'Ticket Status Update',
                message: `Ticket ${data.ticket_number} status changed to ${status.toUpperCase().replace('_', ' ')}.`,
                link: `/dashboard/tickets/${ticketId}`
            });
        }
    }

    return data;
};
