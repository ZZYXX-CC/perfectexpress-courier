'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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

    const { data, error } = await supabase
        .from('shipments')
        .insert({
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

    return { success: true, tracking_number: data.tracking_number }
}
