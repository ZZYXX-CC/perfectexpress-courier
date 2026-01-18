'use server'

import { createClient } from '@/utils/supabase/server'

export async function getShipment(trackingNumber: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single()

    if (error) {
        console.error('Error fetching shipment:', error)
        return null
    }

    return data
}
