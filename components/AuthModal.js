// AuthModal.js
// Reusable modal component for both login and signup functionality
// Props:
//   - isOpen: boolean to control modal visibility
//   - onClose: callback function to close the modal
//   - mode: 'login' or 'signup' to determine which form to show

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthModal({ isOpen, onClose, mode = 'login' }) {
  // Local state for form inputs and UI feedback
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false) // Shows loading state during API calls
  const [error, setError] = useState(null) // Stores error messages to display to user
  const [success, setSuccess] = useState(false) // Shows success message after signup
  
  // Get authentication functions from our auth context
  const { signIn, signUp } = useAuth()

  // Determine if we're in login or signup mode
  const isLogin = mode === 'login'

  // Handle form submission for both login and signup
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // CLIENT-SIDE VALIDATION: Only allow .edu emails to sign up
    // This provides instant feedback before hitting the server
    // Note: Also enforced at database level for security
    if (!isLogin && !email.toLowerCase().endsWith('.edu')) {
      setError('Only .edu email addresses are allowed to sign up')
      return
    }

    setLoading(true)

    try {
      // Call appropriate auth function based on mode
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) throw error

      // Handle success differently for login vs signup
      if (!isLogin) {
        // Signup: Show success message and clear form
        // User needs to verify email before they can log in
        setSuccess(true)
        setEmail('')
        setPassword('')
      } else {
        // Login: Close modal immediately (user is now authenticated)
        onClose()
      }
    } catch (error) {
      // Display any errors from Supabase
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if modal is closed
  if (!isOpen) return null

  return (
    // Modal overlay - clicking outside closes the modal
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      {/* Modal content - prevent clicks from closing modal */}
      <div
        className="bg-white w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-6">
          {isLogin ? 'Log In' : 'Sign Up'}
        </h2>

        {/* Success message for signup */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 text-green-700">
            Check your email to confirm your account!
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              placeholder={isLogin ? "you@example.com" : "you@school.edu"}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 font-semibold text-base hover:bg-gray-900 active:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}

