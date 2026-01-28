'use server'

import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'

/**
 * Keep-alive endpoint to prevent Supabase from pausing the project
 * This runs on a cron schedule (configured in vercel.json)
 */
export async function GET() {
    try {
        const supabase = createServiceClient()
        
        // Simple query to keep the database active
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
        
        if (error) {
            console.error('Keep-alive ping failed:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }
        
        const timestamp = new Date().toISOString()
        console.log(`[${timestamp}] Keep-alive ping successful. Profiles count: ${count}`)
        
        return NextResponse.json({
            success: true,
            timestamp,
            message: 'Database is active',
            profiles_count: count
        })
    } catch (error) {
        console.error('Keep-alive error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
