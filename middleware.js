// middleware.js
// Next.js middleware that runs BEFORE every request
// This refreshes the user's Supabase session on each page load
// Ensures users stay logged in and their auth tokens are always valid

import { updateSession } from './lib/supabase/middleware'

// This function runs on every request that matches the config below
export async function middleware(request) {
  // Call our Supabase session refresh helper
  return await updateSession(request)
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    // Run on all routes EXCEPT:
    // - _next/static (Next.js static files)
    // - _next/image (Next.js image optimization)
    // - favicon.ico (site icon)
    // - Image files (.svg, .png, .jpg, etc.)
    // This regex pattern excludes those paths to avoid unnecessary processing
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

