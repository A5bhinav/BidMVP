// AuthModal.js
// Reusable modal component for both login and signup functionality
// Props:
//   - isOpen: boolean to control modal visibility
//   - onClose: callback function to close the modal
//   - mode: 'login' or 'signup' to determine which form to show

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import PhoneVerificationModal from './PhoneVerificationModal'
import ProfileSetupForm from './ProfileSetupForm'
import { createProfile } from '@/app/actions/profile'

export default function AuthModal({ isOpen, onClose, mode = 'login' }) {
  // Local state for form inputs and UI feedback
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false) // Shows loading state during API calls
  const [error, setError] = useState(null) // Stores error messages to display to user
  const [success, setSuccess] = useState(false) // Shows success message after signup
  
  // Multi-step signup flow state
  const [signupStep, setSignupStep] = useState('email') // 'email' | 'phone' | 'profile'
  const [phone, setPhone] = useState('')
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  
  // Get authentication functions from our auth context
  const { signIn, signUp, user, resendConfirmationEmail } = useAuth()

  // Determine if we're in login or signup mode
  const isLogin = mode === 'login'

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPassword('')
      setError(null)
      setSuccess(false)
      setSignupStep('email')
      setPhone('')
      setPhoneModalOpen(false)
    }
  }, [isOpen])

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.js:66',message:'Before auth call',data:{isLogin,mode,email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3bf1bc05-78e8-4bdd-bb3f-5c49e2efc81a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthModal.js:73',message:'After auth call',data:{hasError:!!result.error,errorMessage:result.error?.message,errorStatus:result.error?.status,hasData:!!result.data,userEmail:result.data?.user?.email,userConfirmed:result.data?.user?.email_confirmed_at,userID:result.data?.user?.id,fullResult:JSON.stringify(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      if (result.error) throw result.error

      // Handle success differently for login vs signup
      if (!isLogin) {
        // Signup: Check if email confirmation is required
        // If session is null, email confirmation is required
        if (!result.data?.session) {
          // Email confirmation required - show success message
          setSuccess(true)
          // Don't proceed to profile setup until email is confirmed
          // User needs to click confirmation link in email first
        } else {
          // Email already confirmed or confirmation disabled - proceed to profile
          setSignupStep('profile')
        }
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

  // Handle phone verification success
  const handlePhoneVerified = (verifiedPhone) => {
    setPhone(verifiedPhone)
    setPhoneModalOpen(false)
    setSignupStep('profile')
  }

  // Handle profile submission
  const handleProfileSubmit = async (profileData) => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    setProfileLoading(true)
    setError(null)

    try {
      // Create user profile using Server Action
      const { data, error: createError } = await createProfile(user.id, profileData)
      
      if (createError) {
        setError(createError.message || 'Failed to create profile')
        return
      }
      
      // Profile created successfully
      setSuccess(true)
      setSignupStep('email')
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      setError(error.message || 'Failed to create profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Don't render anything if modal is closed
  if (!isOpen) return null

  // Render profile setup step
  if (!isLogin && signupStep === 'profile') {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto"
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

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Step 2 of 2</span>
              <span className="text-sm font-semibold text-black">Profile Setup</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div className="bg-black h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>

          {/* Success message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 text-green-700">
              Profile created successfully! Redirecting...
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 text-red-700">
              {error}
            </div>
          )}

          {/* Profile form */}
          <ProfileSetupForm
            onSubmit={handleProfileSubmit}
            loading={profileLoading}
            userId={user?.id}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main auth modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
        onClick={onClose}
      >
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

          {/* Progress indicator for signup */}
          {!isLogin && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  {signupStep === 'email' ? 'Step 1 of 2' : 'Step 2 of 2'}
                </span>
                <span className="text-sm font-semibold text-black">
                  {signupStep === 'email' ? 'Create Account' : 'Profile Setup'}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-black h-2 rounded-full transition-all" 
                  style={{ width: signupStep === 'email' ? '50%' : '100%' }}
                ></div>
              </div>
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold mb-6">
            {isLogin ? 'Log In' : 'Sign Up'}
          </h2>

          {/* Success message for signup */}
          {success && !isLogin && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 text-green-700">
              <p className="mb-2">Check your email to confirm your account!</p>
              <button
                type="button"
                onClick={async () => {
                  setError(null)
                  const { error } = await resendConfirmationEmail(email)
                  if (error) {
                    setError(error.message || 'Failed to resend email')
                  } else {
                    setSuccess(true)
                    setError(null)
                  }
                }}
                className="text-sm underline hover:no-underline"
              >
                Resend confirmation email
              </button>
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
              {loading ? 'Loading...' : isLogin ? 'Log In' : 'Continue'}
            </button>
          </form>
        </div>
      </div>

      {/* Phone verification modal - DISABLED for MVP */}
      {/* Uncomment below to re-enable phone verification when SMS provider is configured */}
      {/* {!isLogin && (
        <PhoneVerificationModal
          isOpen={phoneModalOpen}
          onClose={() => {
            setPhoneModalOpen(false)
            setSignupStep('email')
          }}
          onVerified={handlePhoneVerified}
          initialPhone={phone}
        />
      )} */}
    </>
  )
}

