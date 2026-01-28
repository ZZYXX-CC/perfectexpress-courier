'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ChatSession = {
    id: string
    visitor_name: string
    visitor_email: string
    user_id: string | null
    assigned_admin_id: string | null
    status: 'active' | 'closed'
    unread_count: number
    last_message_at: string
    created_at: string
}

export type ChatMessage = {
    id: string
    session_id: string
    sender_type: 'visitor' | 'admin'
    sender_name: string | null
    message: string
    is_read: boolean
    created_at: string
}

// Create a new chat session
export async function createChatSession(visitorName: string, visitorEmail: string) {
    const supabase = await createClient()
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
            visitor_name: visitorName,
            visitor_email: visitorEmail,
            user_id: user?.id || null,
            status: 'active'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating chat session:', error)
        return { error: error.message }
    }

    return { success: true, session: data }
}

// Get chat session by ID
export async function getChatSession(sessionId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (error) {
        console.error('Error fetching chat session:', error)
        return null
    }

    return data as ChatSession
}

// Get all active chat sessions (for admin)
export async function getActiveChatSessions() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('last_message_at', { ascending: false })

    if (error) {
        console.error('Error fetching chat sessions:', error)
        return []
    }

    return data as ChatSession[]
}

// Send a chat message
export async function sendChatMessage(
    sessionId: string, 
    message: string, 
    senderType: 'visitor' | 'admin',
    senderName?: string
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            session_id: sessionId,
            sender_type: senderType,
            sender_name: senderName,
            message: message
        })
        .select()
        .single()

    if (error) {
        console.error('Error sending message:', error)
        return { error: error.message }
    }

    return { success: true, message: data }
}

// Get messages for a chat session
export async function getChatMessages(sessionId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching messages:', error)
        return []
    }

    return data as ChatMessage[]
}

// Close a chat session
export async function closeChatSession(sessionId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('chat_sessions')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', sessionId)

    if (error) {
        console.error('Error closing chat session:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/chat')
    return { success: true }
}

// Mark messages as read (for admin)
export async function markMessagesAsRead(sessionId: string) {
    const supabase = await createClient()

    // Mark all unread visitor messages as read
    await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('sender_type', 'visitor')
        .eq('is_read', false)

    // Reset unread count on session
    await supabase
        .from('chat_sessions')
        .update({ unread_count: 0 })
        .eq('id', sessionId)

    return { success: true }
}
