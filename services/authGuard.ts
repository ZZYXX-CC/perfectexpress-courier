import { supabase } from './supabase';

/**
 * Safely resolves the active user ID, considering impersonation.
 * Impersonation is ONLY allowed if the authenticated user has the 'admin' role.
 * Non-admins attempting impersonation will have the impersonation key cleared.
 */
export async function getActiveUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const impersonatedId = localStorage.getItem('impersonated_user_id');
    if (!impersonatedId) return user.id;

    // Verify caller is admin before allowing impersonation
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile && String(profile.role).toLowerCase().trim() === 'admin';

    if (isAdmin) {
        return impersonatedId;
    }

    // Non-admin trying to impersonate — clear it
    localStorage.removeItem('impersonated_user_id');
    return user.id;
}
