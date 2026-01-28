'use server'

import { createClient } from '@/utils/supabase/server'

export type ShipmentFormData = {
    sender_name: string
    sender_email: string
    sender_address: string
    receiver_name: string
    receiver_email: string
    receiver_address: string
    parcel_description: string
    parcel_weight: string
}

export async function createShipment(formData: ShipmentFormData) {
    const supabase = await createClient()

    // Check for logged-in user
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('shipments')
        .insert({
            user_id: user?.id || null, // Link to user if authenticated
            sender_info: {
                name: formData.sender_name,
                email: formData.sender_email,
                address: formData.sender_address,
            },
            receiver_info: {
                name: formData.receiver_name,
                email: formData.receiver_email,
                address: formData.receiver_address,
            },
            parcel_details: {
                description: formData.parcel_description,
                weight: formData.parcel_weight,
            },
            status: 'pending',
            payment_status: 'unpaid',
            history: [
                {
                    status: 'pending',
                    location: 'System',
                    timestamp: new Date().toISOString(),
                    note: 'Shipment created'
                }
            ]
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating shipment:', error)
        return { error: 'Failed to create shipment. Please try again.' }
    }

    // Trigger Email Notification (Non-blocking) - Notify BOTH sender and receiver
    try {
        const { sendShipmentCreatedEmail, sendShipmentReceiverNotification } = await import('@/lib/email')
        
        // Notify sender
        await sendShipmentCreatedEmail(
            formData.sender_email,
            data?.tracking_number || 'N/A',
            formData.sender_name
        )
        
        // Notify receiver that a package is coming their way
        if (formData.receiver_email) {
            await sendShipmentReceiverNotification(
                formData.receiver_email,
                data?.tracking_number || 'N/A',
                formData.receiver_name,
                formData.sender_name
            )
        }
    } catch (emailError) {
        console.error('Failed to send creation email:', emailError)
        // We don't fail the whole action if email fails
    }

    return { success: true, tracking_number: data.tracking_number }
}
