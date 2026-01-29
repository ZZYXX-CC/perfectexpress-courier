import { supabase } from './supabase';

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
    // 1. Create Ticket
    const ticketNumber = generateTicketNumber();
    const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
            ticket_number: ticketNumber,
            user_id: data.userId || null,
            name: data.name,
            email: data.email,
            subject: data.subject,
            status: 'open',
            priority: 'normal'
        })
        .select()
        .single();

    if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        return { error: ticketError.message };
    }

    // 2. Add Initial Message as Reply
    const { error: replyError } = await supabase
        .from('ticket_replies')
        .insert({
            ticket_id: ticket.id,
            sender_type: 'customer',
            sender_name: data.name,
            message: data.message
        });

    if (replyError) {
        console.error('Error creating initial reply:', replyError);
        // Non-fatal
    }

    return { success: true, ticket };
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
    return data;
};
