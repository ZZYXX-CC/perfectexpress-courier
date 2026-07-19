import { supabase } from './supabase';
import { notificationService } from './notificationService';
import { emailService, buildGuestSupportLink } from './emailService';

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
    channel?: 'form' | 'chat';
    guest_access_token?: string | null;
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
    channel?: 'form' | 'chat';
}) => {
    // Create via the SECURITY DEFINER RPC so anonymous (guest) visitors can open
    // tickets under RLS. The RPC inserts the ticket + the initial reply, and (for
    // guests) mints a guest_access_token. Admin notifications + emails are handled
    // by the trg_notify_on_ticket_insert trigger — not here.
    const { data: ticket, error: ticketError } = await supabase.rpc('create_support_ticket', {
        p_ticket_number: generateTicketNumber(),
        p_name: data.name,
        p_email: data.email,
        p_subject: data.subject,
        p_message: data.message,
        p_user_id: data.userId ?? null,
        p_channel: data.channel ?? 'form',
    });

    if (ticketError || !ticket) {
        console.error('Error creating ticket:', ticketError);
        return { error: ticketError?.message || 'Failed to create ticket.' };
    }

    // Guest ticket: email the private follow-up link (guests have no in-app inbox).
    let guestLink: string | undefined;
    if (ticket.guest_access_token) {
        guestLink = buildGuestSupportLink(ticket.id, ticket.guest_access_token);
        await emailService.sendEmail({
            to: ticket.email,
            ...emailService.templates.guestTicketConfirmation(
                ticket.ticket_number, ticket.name, ticket.id, ticket.guest_access_token
            ),
        });
    }

    return { success: true, ticket, guestLink };
};

// Guest (no-account) ticket access — backed by SECURITY DEFINER RPCs that check
// the bearer token. Returns { ticket, replies }.
export const getGuestTicket = async (ticketId: string, token: string) => {
    const { data, error } = await supabase.rpc('get_guest_support_ticket', {
        p_ticket_id: ticketId,
        p_token: token,
    });
    if (error) throw error;
    return data as { ticket: SupportTicket; replies: TicketReply[] };
};

export const addGuestReply = async (ticketId: string, token: string, message: string) => {
    const { data, error } = await supabase.rpc('add_guest_support_reply', {
        p_ticket_id: ticketId,
        p_token: token,
        p_message: message,
    });
    if (error) throw error;
    return data as TicketReply;
};

// Most recent still-open live-chat ticket for a logged-in user (for resuming
// the conversation). Returns null if their last chat was closed/resolved.
export const getOpenChatTicket = async (userId: string): Promise<SupportTicket | null> => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .eq('channel', 'chat')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) {
        console.error('getOpenChatTicket error:', error);
        return null;
    }
    return data as SupportTicket | null;
};

export const getUserTickets = async (userId: string) => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupportTicket[];
};

// Past live-chat conversations for the signed-in user (all statuses), newest
// first — powers the chat widget's history view.
export const getUserChatTickets = async (userId: string): Promise<SupportTicket[]> => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .eq('channel', 'chat')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('getUserChatTickets error:', error);
        return [];
    }
    return (data || []) as SupportTicket[];
};

export const getAllTickets = async () => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupportTicket[];
}

export const getTicketDetails = async (ticketId: string) => {
    const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (ticketError) throw ticketError;

    const { data: replies, error: replyError } = await supabase
        .from('ticket_replies')
        .select('*')
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
        const { data: ticket } = await supabase.from('support_tickets')
            .select('id, user_id, ticket_number, email, guest_access_token').eq('id', ticketId).single();
        if (ticket?.user_id && ticket.user_id !== currentUser?.id) {
            // Registered owner: in-app notification + email.
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

            if (notifError) console.error('Notification trigger failed:', notifError);
        } else if (!ticket?.user_id && ticket?.email && ticket?.guest_access_token) {
            // Guest owner: no in-app inbox — email the reply plus their private link.
            await emailService.sendEmail({
                to: ticket.email,
                ...emailService.templates.guestTicketReply(
                    ticket.ticket_number, ticket.id, ticket.guest_access_token, message
                ),
            });
        } else {
            console.log('Notification suppressed: Self-reply or missing owner', { ticketOwnerId: ticket?.user_id, currentUserId: currentUser?.id });
        }
    } else {
        // Customer reply -> notify all admins. Handled server-side by the
        // trg_notify_on_customer_reply trigger (SECURITY DEFINER): a customer
        // can neither read the admin list nor insert cross-user notifications
        // under RLS, so this must not run client-side.
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
