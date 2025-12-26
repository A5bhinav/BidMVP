// app/auth/callback/route.js
// Handles email verification callbacks from Supabase
// When users click the verification link in their email, Supabase redirects here
// This route exchanges the verification token for a session

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  // If there's a code, exchange it for a session
  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    // This verifies the email and creates an authenticated session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! User is now authenticated
      // Redirect to the specified next URL or home page
      // If profile is incomplete, they'll be redirected to onboarding by middleware
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no code, redirect to home with error
  // The error will be visible in the URL as a search param
  const errorUrl = new URL('/', request.url)
  errorUrl.searchParams.set('error', 'verification_failed')
  return NextResponse.redirect(errorUrl)
}

