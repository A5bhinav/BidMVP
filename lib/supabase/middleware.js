// lib/supabase/middleware.js
// Helper function for Next.js middleware to refresh user sessions
// This runs on EVERY request before the page loads (configured in middleware.js)
// It ensures the user's session is always fresh and valid

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  // Create initial response that continues to the next middleware/page
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client configured for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Read cookies from the incoming request
        getAll() {
          return request.cookies.getAll()
        },
        // Write cookies to both request and response
        // This ensures updated session cookies are sent back to browser
        setAll(cookiesToSet) {
          // Update cookies in the request (for next handlers in chain)
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          // Set cookies in the response (sent back to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Get user to refresh their session
  // This must be called to validate/refresh the auth token
  // Don't add logic between createServerClient and this call
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Return response with potentially updated session cookies
  return supabaseResponse
}

