// lib/supabase/admin.js
// Supabase admin client for server-to-server operations (webhooks, cron jobs)
// Uses service role key to bypass RLS — NEVER expose this on the client side
// This is required for operations where there are no user cookies (e.g., Stripe webhooks)

import { createClient } from '@supabase/supabase-js'

let adminClient = null

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
            'The service role key is required for server-to-server operations like webhooks.'
        )
    }

    // Reuse the client instance to avoid creating a new connection on every call
    if (!adminClient) {
        adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })
    }

    return adminClient
}
