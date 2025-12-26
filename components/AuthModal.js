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
import { mockCreateUserProfile } from '@/lib/mocks/userFunctions'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
  const { signIn, signUp, user } = useAuth()

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
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) throw error

      // Handle success differently for login vs signup
      if (!isLogin) {
        // Signup: Move to phone verification step
        setSignupStep('phone')
        setPhoneModalOpen(true)
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
    setProfileLoading(true)
    setError(null)

    try {
      // Add phone to profile data
      const fullProfileData = {
        ...profileData,
        phone,
      }

      // Create user profile
      await mockCreateUserProfile(fullProfileData)
      
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
        <Card
          className="w-full max-w-md relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-medium hover:text-neutral-black transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-bodySmall font-semibold text-gray-medium">Step 3 of 3</span>
              <span className="text-bodySmall font-semibold text-neutral-black">Profile Setup</span>
            </div>
            <div className="w-full bg-gray-light h-2 rounded-full">
              <div className="bg-primary-accent h-2 rounded-full transition-all" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-heading1 text-neutral-black mb-6">Complete Your Profile</h2>

          {/* Success message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-success text-success rounded-md">
              Profile created successfully! Redirecting...
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-error text-error rounded-md">
              {error}
            </div>
          )}

          {/* Profile form */}
          <ProfileSetupForm
            onSubmit={handleProfileSubmit}
            loading={profileLoading}
          />
        </Card>
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
        <Card
          className="w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-medium hover:text-neutral-black transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>

          {/* Progress indicator for signup */}
          {!isLogin && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-bodySmall font-semibold text-gray-medium">
                  {signupStep === 'email' ? 'Step 1 of 3' : 'Step 2 of 3'}
                </span>
                <span className="text-bodySmall font-semibold text-neutral-black">
                  {signupStep === 'email' ? 'Create Account' : 'Verify Phone'}
                </span>
              </div>
              <div className="w-full bg-gray-light h-2 rounded-full">
                <div 
                  className="bg-primary-accent h-2 rounded-full transition-all" 
                  style={{ width: signupStep === 'email' ? '33%' : '66%' }}
                ></div>
              </div>
            </div>
          )}

          {/* Title */}
          <h2 className="text-heading1 text-neutral-black mb-6">
            {isLogin ? 'Log In' : 'Sign Up'}
          </h2>

          {/* Success message for signup */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-2 border-success text-success rounded-md">
              Check your email to confirm your account!
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-error text-error rounded-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-bodySmall font-semibold mb-2 text-neutral-black"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={isLogin ? "you@example.com" : "you@school.edu"}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-bodySmall font-semibold mb-2 text-neutral-black"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="large"
              className="w-full"
            >
              {loading ? 'Loading...' : isLogin ? 'Log In' : 'Continue'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Phone verification modal */}
      {!isLogin && (
        <PhoneVerificationModal
          isOpen={phoneModalOpen}
          onClose={() => {
            setPhoneModalOpen(false)
            setSignupStep('email')
          }}
          onVerified={handlePhoneVerified}
          initialPhone={phone}
        />
      )}
    </>
  )
}

