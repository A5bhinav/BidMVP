// app/page.js
// Main home page component
// Shows login/signup buttons when user is logged out
// Shows welcome message and sign out button when user is logged in

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Home() {
  // Local state to control the auth modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login') // 'login' or 'signup'
  
  // Get current user and signOut function from auth context
  const { user, signOut } = useAuth()

  // Helper functions to open modal in different modes
  const openLoginModal = () => {
    setModalMode('login')
    setModalOpen(true)
  }

  const openSignupModal = () => {
    setModalMode('signup')
    setModalOpen(true)
  }

  // Handle user sign out
  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <main className="h-screen w-screen bg-white flex flex-col">
      {/* Center area - shows welcome message if logged in */}
      <div className="flex-1 flex items-center justify-center px-6">
        {user && (
          <Card className="text-center max-w-md w-full">
            <p className="text-heading1 text-neutral-black mb-2">Welcome!</p>
            <p className="text-bodySmall text-gray-dark mb-6">{user.email}</p>
            <Button
              onClick={handleSignOut}
              variant="secondary"
              size="large"
              className="w-full"
            >
              Sign Out
            </Button>
          </Card>
        )}
      </div>
      
      {/* Bottom buttons - only visible when not logged in */}
      {!user && (
        <div className="w-full px-6 pb-10 safe-area-bottom">
          <div className="flex gap-4">
            {/* Log In button - secondary variant */}
            <Button
              onClick={openLoginModal}
              variant="secondary"
              size="large"
              className="flex-1"
            >
              Log In
            </Button>
            {/* Sign Up button - primary variant */}
            <Button
              onClick={openSignupModal}
              variant="primary"
              size="large"
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}

      {/* Reusable auth modal - switches between login and signup mode */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </main>
  )
}

