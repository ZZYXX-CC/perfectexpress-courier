import { supabase } from './supabase';
import { notificationService } from './notificationService';

export interface ChatSession {
    id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    status: 'active' | 'closed';
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    sender_type: 'customer' | 'admin';
    sender_name: string | null;
    message: string;
    created_at: string;
}

export const createChatSession = async (payload: {
    userId: string;
    userEmail: string;
    userName: string;
}) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
            user_id: payload.userId,
            user_email: payload.userEmail,
            user_name: payload.userName,
            status: 'active'
        })
        .select()
        .single();

    if (error) throw error;
    return data as ChatSession;
};

export const getUserChatSessions = async (userId: string) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as ChatSession[];
};

export const getAllChatSessions = async () => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as ChatSession[];
};

export const getChatMessages = async (sessionId: string) => {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data as ChatMessage[];
};

export const sendChatMessage = async (payload: {
    sessionId: string;
    senderType: 'customer' | 'admin';
    senderName: string;
    message: string;
}) => {
    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            session_id: payload.sessionId,
            sender_type: payload.senderType,
            sender_name: payload.senderName,
            message: payload.message
        })
        .select()
        .single();

    if (error) throw error;

    await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString(), status: 'active' })
        .eq('id', payload.sessionId);

    // Trigger notifications for chat messages
    try {
        const { data: session } = await supabase
            .from('chat_sessions')
            .select('user_id, user_name')
            .eq('id', payload.sessionId)
            .single();

        if (session) {
            if (payload.senderType === 'customer') {
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'admin');
                if (admins) {
                    for (const admin of admins) {
                        await notificationService.createNotification({
                            user_id: admin.id,
                            type: 'chat_message',
                            title: 'New Chat Message',
                            message: `${payload.senderName || 'A customer'} sent a live chat message.`,
                            link: `/dashboard?tab=chat`
                        });
                    }
                }
            } else if (payload.senderType === 'admin' && session.user_id) {
                await notificationService.createNotification({
                    user_id: session.user_id,
                    type: 'chat_message',
                    title: 'Agent Response',
                    message: `${payload.senderName || 'Support agent'} replied to your chat.`,
                    link: `/dashboard?tab=chat`
                });
            }
        }
    } catch {
        // Non-blocking: notification failure shouldn't break chat
    }

    return data as ChatMessage;
};

export const updateChatSessionStatus = async (sessionId: string, status: 'active' | 'closed') => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
    return data as ChatSession;
};
