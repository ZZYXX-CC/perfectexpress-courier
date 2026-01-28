'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all shipments for admin (optimized with specific columns)
export async function getAllShipments(limit: number = 100) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shipments')
        .select('id, tracking_number, sender_info, receiver_info, parcel_details, status, payment_status, current_location, history, created_at, price')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching shipments:', error)
        return []
    }

    return data
}

// Update shipment status/payment/location
// Update shipment status/payment/location
export async function updateShipment(
    id: string,
    updates: {
        status?: string
        payment_status?: string
        current_location?: string
        price?: number
        created_at?: string
        sender_info?: any
        receiver_info?: any
        parcel_details?: any
    }
) {
    const supabase = await createClient()

    // Auto-update payment status if status becomes confirmed
    if (updates.status === 'confirmed') {
        updates.payment_status = 'paid'
    }

    // First: Perform the update (this should work with RLS if user is authenticated)
    const { error: updateError } = await supabase
        .from('shipments')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (updateError) {
        console.error('Error updating shipment:', updateError.message, updateError.code)
        return { error: `Failed to update shipment: ${updateError.message}` }
    }

    // Second: Try to fetch shipment for lifecycle emails (non-blocking)
    try {
        const { data: shipment } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', id)
            .single()

        if (shipment) {
            const {
                sendShipmentApprovedEmail,
                sendShipmentDispatchedEmail,
                sendShipmentDeliveredEmail,
                sendPaymentConfirmedEmail
            } = await import('@/lib/email')

            const senderEmail = (shipment.sender_info as any)?.email
            const receiverEmail = (shipment.receiver_info as any)?.email
            const senderName = (shipment.sender_info as any)?.name || 'Customer'
            const receiverName = (shipment.receiver_info as any)?.name || 'Customer'
            const shipmentAny = shipment as any
            const recipients = [senderEmail, receiverEmail].filter(Boolean) as string[]

            // 1. Approval (Price set for the first time) - Notify BOTH
            if (updates.price && !shipmentAny.price) {
                for (const email of recipients) {
                    await sendShipmentApprovedEmail(email, shipment.tracking_number as string, updates.price)
                }
            }

            // 2. Payment Confirmed (status becomes 'confirmed') - Notify BOTH
            if (updates.status === 'confirmed' && shipment.status !== 'confirmed') {
                if (senderEmail) {
                    await sendPaymentConfirmedEmail(senderEmail, shipment.tracking_number as string, senderName)
                }
                if (receiverEmail) {
                    await sendPaymentConfirmedEmail(receiverEmail, shipment.tracking_number as string, receiverName)
                }
            }

            // 3. Dispatched - Notify BOTH
            if (updates.status === 'in-transit' && shipment.status !== 'in-transit') {
                for (const email of recipients) {
                    await sendShipmentDispatchedEmail(email, shipment.tracking_number as string, updates.current_location || shipment.current_location || 'Origin')
                }
            }

            // 4. Delivered - Notify BOTH
            if (updates.status === 'delivered' && shipment.status !== 'delivered') {
                for (const email of recipients) {
                    await sendShipmentDeliveredEmail(email, shipment.tracking_number as string)
                }
            }
        }
    } catch (emailError) {
        console.error('Failed to send lifecycle email (non-critical):', emailError)
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

    // Auto-update payment status if status becomes confirmed
    const updatesWithAutoPayment: any = {
        status: event.status,
        current_location: event.location,
        history: updatedHistory,
        updated_at: new Date().toISOString()
    }

    if (event.status === 'confirmed') {
        updatesWithAutoPayment.payment_status = 'paid'
    }

    // Update the shipment
    const { error: updateError } = await supabase
        .from('shipments')
        .update(updatesWithAutoPayment)
        .eq('id', id)

    if (updateError) {
        console.error('Error updating shipment:', updateError)
        return { error: 'Failed to log event' }
    }

    // Real email notification - to BOTH sender and receiver
    if (notifyUser) {
        try {
            const { sendShipmentStatusUpdateEmail } = await import('@/lib/email')
            const senderEmail = (shipment.sender_info as any)?.email
            const receiverEmail = (shipment.receiver_info as any)?.email
            const recipients = [senderEmail, receiverEmail].filter(Boolean) as string[]

            for (const email of recipients) {
                await sendShipmentStatusUpdateEmail(
                    email,
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

// Delete a shipment
export async function deleteShipment(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting shipment:', error)
        return { error: 'Failed to delete shipment' }
    }

    revalidatePath('/admin')
    return { success: true }
}

// --- User Management Actions ---

export async function getAllUsers(limit: number = 100) {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching users:', error)
        return []
    }

    return profiles
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
    const { createServiceClient } = await import('@/utils/supabase/service')
    const supabaseAdmin = createServiceClient()

    // 1. Update public.profiles role
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        console.error('Error updating role:', error)
        return { error: 'Failed to update user role' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function createUser(userData: { email: string; password: string; fullName: string; role: 'user' | 'admin' }) {
    // Use SERVICE ROLE client to create user without logging out current admin
    const { createServiceClient } = await import('@/utils/supabase/service')
    const supabaseAdmin = createServiceClient()

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { full_name: userData.fullName }
    })

    if (authError || !authData.user) {
        console.error('Error creating auth user:', authError)
        return { error: authError?.message || 'Failed to create user' }
    }

    // 2. Insert/Update Profile (If trigger handles it, this might fail on duplicate key or update existing. Let's try upsert to be safe or rely on trigger)
    // We update the role immediately after creation.

    // Give trigger a moment or retry profile update?
    // Let's force update the role on the profile via upsert which creates if not exists
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: authData.user.id,
            email: userData.email,
            full_name: userData.fullName,
            role: userData.role,
            updated_at: new Date().toISOString()
        })

    if (profileError) {
        console.error('Error updating profile:', profileError)
        // If upsert fails, it might be due to RLS if not using service client, but we ARE using service client.
        return { warning: 'User created, but profile sync failed. Check role manually.', success: true }
    }

    revalidatePath('/admin')
    return { success: true }
}
