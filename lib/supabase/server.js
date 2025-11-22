// lib/supabase/server.js
// Creates a Supabase client for use in SERVER COMPONENTS and SERVER ACTIONS
// This handles authentication differently than the browser client
// It manually manages cookies since server components don't have direct cookie access

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Get the cookie store from Next.js (async in App Router)
  const cookieStore = await cookies()

  // Create server-side Supabase client with custom cookie handlers
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Get all cookies (needed for reading auth session)
        getAll() {
          return cookieStore.getAll()
        },
        // Set cookies (needed when auth state changes)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // If called from a Server Component, this will fail
            // That's OK - our middleware handles session refresh
            // This try-catch prevents crashes during SSR
          }
        },
      },
    }
  )
}

