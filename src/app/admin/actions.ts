'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all shipments for admin
export async function getAllShipments() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching shipments:', error)
        return []
    }

    return data
}

// Update shipment status/payment/location
export async function updateShipment(
    id: string,
    updates: {
        status?: string
        payment_status?: string
        current_location?: string
        price?: number // Added price
    }
) {
    const supabase = await createClient()

    // Fetch current state to detect transitions
    const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !shipment) {
        console.error('Error fetching shipment for update:', fetchError)
        return { error: 'Failed to find shipment' }
    }

    const { error } = await supabase
        .from('shipments')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating shipment:', error)
        return { error: 'Failed to update shipment' }
    }

    // --- Lifecycle Emails ---
    try {
        const {
            sendShipmentApprovedEmail,
            sendShipmentDispatchedEmail,
            sendShipmentDeliveredEmail
        } = await import('@/lib/email')

        const senderEmail = (shipment.sender_info as any)?.email
        const shipmentAny = shipment as any

        // 1. Approval (Price set for the first time)
        if (updates.price && !shipmentAny.price && senderEmail) {
            await sendShipmentApprovedEmail(senderEmail, shipment.tracking_number as string, updates.price)
        }

        // 2. Dispatched
        if (updates.status === 'in-transit' && shipment.status !== 'in-transit' && senderEmail) {
            await sendShipmentDispatchedEmail(senderEmail, shipment.tracking_number as string, updates.current_location || shipment.current_location || 'Origin')
        }

        // 3. Delivered
        if (updates.status === 'delivered' && shipment.status !== 'delivered' && senderEmail) {
            await sendShipmentDeliveredEmail(senderEmail, shipment.tracking_number as string)
        }
    } catch (emailError) {
        console.error('Failed to send lifecycle email:', emailError)
    }

    revalidatePath('/admin')
    return { success: true }
}

// Log a new event to shipment history
export async function logShipmentEvent(
    id: string,
    event: {
        status: string
        location: string
        note?: string
    },
    notifyUser: boolean = false
) {
    const supabase = await createClient()

    // First, get the current shipment to access history
    const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !shipment) {
        console.error('Error fetching shipment:', fetchError)
        return { error: 'Failed to fetch shipment' }
    }

    const currentHistory = (shipment.history as any[]) || []
    const newEvent = {
        ...event,
        timestamp: new Date().toISOString()
    }
    const updatedHistory = [...currentHistory, newEvent]

    // Update the shipment
    const { error: updateError } = await supabase
        .from('shipments')
        .update({
            status: event.status,
            current_location: event.location,
            history: updatedHistory,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (updateError) {
        console.error('Error updating shipment:', updateError)
        return { error: 'Failed to log event' }
    }

    // Real email notification
    if (notifyUser) {
        try {
            const { sendShipmentStatusUpdateEmail } = await import('@/lib/email')
            const senderEmail = (shipment.sender_info as any)?.email
            if (senderEmail) {
                await sendShipmentStatusUpdateEmail(
                    senderEmail,
                    shipment.tracking_number as string,
                    event.status,
                    event.location,
                    event.note
                )
            }
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError)
        }
    }

    revalidatePath('/admin')
    return { success: true }
}

// Toggle payment status
export async function togglePaymentStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    return updateShipment(id, { payment_status: newStatus })
}
