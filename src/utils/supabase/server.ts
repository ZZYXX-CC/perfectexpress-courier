import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Server-side Supabase client using @supabase/supabase-js
// For server actions in Next.js App Router
export async function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}
