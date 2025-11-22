// AuthContext.js
// Provides authentication state and functions to the entire app
// This context wraps the app in layout.js so any component can access:
//   - user: current user object (null if not logged in)
//   - loading: boolean for initial auth state check
//   - signUp, signIn, signOut: authentication functions

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Create the context that will hold our auth state and functions
const AuthContext = createContext({})

// Custom hook to use auth context in any component
// Usage: const { user, signIn, signOut } = useAuth()
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Throw error if hook is used outside of AuthProvider
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider component that wraps the app and manages auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Stores current user object
  const [loading, setLoading] = useState(true) // True until initial session check completes
  const supabase = createClient() // Create Supabase client for browser

  useEffect(() => {
    // On mount: Check if user already has an active session
    // This happens when user refreshes page or returns to app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Set up listener for auth state changes
    // Fires when user logs in, logs out, token refreshes, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup: unsubscribe from listener when component unmounts
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Create new user account
  // Supabase will send a confirmation email by default
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  // Sign in existing user with email and password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  // Sign out current user and clear session
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Package everything we want to expose to consuming components
  const value = {
    user,        // Current user object or null
    loading,     // Loading state for initial check
    signUp,      // Function to create account
    signIn,      // Function to log in
    signOut,     // Function to log out
  }

  // Provide auth state and functions to all child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

