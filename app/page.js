// app/page.js
// Main home page component
// Shows login/signup buttons when user is logged out
// Shows welcome message and sign out button when user is logged in

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'

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
      <div className="flex-1 flex items-center justify-center">
        {user && (
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Welcome!</p>
            <p className="text-gray-600 mb-4">{user.email}</p>
            <button
              onClick={handleSignOut}
              className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-900 active:bg-gray-800 transition-all"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      
      {/* Bottom buttons - only visible when not logged in */}
      {/* Two side-by-side buttons: white with border (login) and black (signup) */}
      {!user && (
        <div className="w-full px-8 pb-10 safe-area-bottom">
          <div className="flex gap-4">
            {/* Log In button - white background with black border */}
            <button
              onClick={openLoginModal}
              className="flex-1 bg-white text-black py-4 border-2 border-black font-semibold text-base hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              Log In
            </button>
            {/* Sign Up button - black background */}
            <button
              onClick={openSignupModal}
              className="flex-1 bg-black text-white py-4 border-2 border-black font-semibold text-base hover:bg-gray-900 active:bg-gray-800 transition-all"
            >
              Sign Up
            </button>
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

