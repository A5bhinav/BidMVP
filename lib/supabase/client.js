// lib/supabase/client.js
// Creates a Supabase client for use in CLIENT COMPONENTS (browser)
// This is used in contexts and components that run on the client side
// The browser client handles cookies automatically for session management

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Create and return a browser-safe Supabase client
  // Reads credentials from environment variables (set in .env file)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,      // Your Supabase project URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // Your Supabase anonymous key
  )
}

