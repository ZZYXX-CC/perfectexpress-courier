'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type SupportTicket = {
    id: string
    ticket_number: string
    user_id: string | null
    name: string
    email: string
    subject: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    created_at: string
    updated_at: string
}

export type TicketReply = {
    id: string
    ticket_id: string
    sender_type: 'customer' | 'admin'
    sender_name: string | null
    message: string
    created_at: string
}

// Create a new support ticket
export async function createTicket(data: {
    name: string
    email: string
    subject: string
    message: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
}) {
    const supabase = await createClient()
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
            user_id: user?.id || null,
            name: data.name,
            email: data.email,
            subject: data.subject,
            priority: data.priority || 'normal',
            status: 'open'
        })
        .select()
        .single()

    if (ticketError) {
        console.error('Error creating ticket:', ticketError)
        return { error: ticketError.message }
    }

    // Add the initial message as first reply
    const { error: replyError } = await supabase
        .from('ticket_replies')
        .insert({
            ticket_id: ticket.id,
            sender_type: 'customer',
            sender_name: data.name,
            message: data.message
        })

    if (replyError) {
        console.error('Error adding initial message:', replyError)
    }

    return { success: true, ticket }
}

// Get ticket by ID
export async function getTicket(ticketId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

    if (error) {
        console.error('Error fetching ticket:', error)
        return null
    }

    return data as SupportTicket
}

// Get ticket by ticket number
export async function getTicketByNumber(ticketNumber: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single()

    if (error) {
        console.error('Error fetching ticket:', error)
        return null
    }

    return data as SupportTicket
}

// Get all tickets for admin
export async function getAllTickets() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching tickets:', error)
        return []
    }

    return data as SupportTicket[]
}

// Get user's tickets
export async function getUserTickets() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching user tickets:', error)
        return []
    }

    return data as SupportTicket[]
}

// Get replies for a ticket
export async function getTicketReplies(ticketId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching replies:', error)
        return []
    }

    return data as TicketReply[]
}

// Add a reply to a ticket
export async function addTicketReply(data: {
    ticketId: string
    message: string
    senderType: 'customer' | 'admin'
    senderName: string
}) {
    const supabase = await createClient()

    const { data: reply, error } = await supabase
        .from('ticket_replies')
        .insert({
            ticket_id: data.ticketId,
            sender_type: data.senderType,
            sender_name: data.senderName,
            message: data.message
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding reply:', error)
        return { error: error.message }
    }

    // Send email notification
    try {
        const ticket = await getTicket(data.ticketId)
        if (ticket) {
            const { sendTicketReplyNotification } = await import('@/lib/email')
            
            if (data.senderType === 'admin') {
                // Admin replied - notify customer
                await sendTicketReplyNotification(
                    ticket.email,
                    ticket.ticket_number,
                    ticket.subject,
                    data.message,
                    'admin'
                )
            } else {
                // Customer replied - notify admin (send to a configured admin email or skip)
                // For now, we'll just log it
                console.log('Customer replied to ticket:', ticket.ticket_number)
            }
        }
    } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
    }

    revalidatePath(`/support/${data.ticketId}`)
    revalidatePath('/admin/tickets')
    return { success: true, reply }
}

// Update ticket status
export async function updateTicketStatus(ticketId: string, status: SupportTicket['status']) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

    if (error) {
        console.error('Error updating ticket status:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/tickets')
    return { success: true }
}

// Update ticket priority
export async function updateTicketPriority(ticketId: string, priority: SupportTicket['priority']) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('support_tickets')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

    if (error) {
        console.error('Error updating ticket priority:', error)
        return { error: error.message }
    }

    revalidatePath('/admin/tickets')
    return { success: true }
}
