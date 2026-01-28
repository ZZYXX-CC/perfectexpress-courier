'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: { email: string; password: string; fullName: string }) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
            data: {
                full_name: formData.fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true, message: 'Check your email to confirm your account!' }
}

export async function signIn(formData: { email: string; password: string }) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}

export async function getUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .eq('id', user.id)
        .single()

    return profile
}

export async function isAdmin() {
    const profile = await getUserProfile()
    return profile?.role === 'admin'
}

export async function getUserShipments(limit: number = 50) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('shipments')
        .select('id, tracking_number, sender_info, receiver_info, parcel_details, status, payment_status, current_location, history, created_at, price')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching user shipments:', error)
        return []
    }

    return data
}

// Profile Management Actions

export async function updateProfile(formData: { fullName: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Update the profile table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: formData.fullName,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (profileError) {
        return { error: profileError.message }
    }

    // Also update user metadata
    const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
    })

    if (authError) {
        console.error('Failed to update auth metadata:', authError)
    }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateEmail(newEmail: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase.auth.updateUser({
        email: newEmail
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Confirmation email sent to your new address. Please verify to complete the change.' }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
        return { error: 'Not authenticated' }
    }

    // First verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
    })

    if (signInError) {
        return { error: 'Current password is incorrect' }
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (updateError) {
        return { error: updateError.message }
    }

    return { success: true }
}

// Password Reset Actions

export async function requestPasswordReset(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, message: 'Password reset link sent to your email!' }
}

export async function resetPassword(newPassword: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
