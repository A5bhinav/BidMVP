// app/fraternities/create/page.js
// Page for creating a new fraternity

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFraternity } from '@/contexts/FraternityContext'
import { createFraternityAction } from '@/app/actions/fraternity'
import { getProfile } from '@/app/actions/profile'
import FraternityForm from '@/components/FraternityForm'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function CreateFraternityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { refreshFraternities } = useFraternity()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Fetch user profile to get school_id
  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading || !user?.id) {
        return
      }

      setProfileLoading(true)
      try {
        const { data, error: profileError } = await getProfile(user.id)
        if (profileError) {
          setError('Failed to load your profile. Please complete your profile first.')
        } else {
          setUserProfile(data)
        }
      } catch (err) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id, authLoading])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (fraternityData) => {
    setError(null)
    setLoading(true)

    try {
      // Convert type from capitalized to lowercase for backend
      // Map form data to backend format
      const backendData = {
        name: fraternityData.name,
        type: fraternityData.type.toLowerCase(), // 'Fraternity' -> 'fraternity'
        verification_email: fraternityData.verification_email || null,
        photo_url: fraternityData.photo || null,
        description: fraternityData.description || null,
      }

      const { data, error: createError } = await createFraternityAction(backendData)

      if (createError) {
        // Handle duplicate name warning
        if (createError.code === 'DUPLICATE_NAME' && createError.allowCreation) {
          // User can still proceed - backend allows creation but flags for review
          // We'll just show a success message and redirect
          // The duplicate warning is already handled in the form
        } else {
          setError(createError.message || 'Failed to create fraternity')
          setLoading(false)
          return
        }
      }

      if (data) {
        // Refresh fraternity context to include new fraternity
        await refreshFraternities()
        // Redirect to fraternity dashboard
        router.push(`/fraternities/${data.id}`)
      } else {
        setError('Failed to create fraternity')
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to create fraternity')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">Loading...</p>
        </Card>
      </main>
    )
  }

  // If not logged in, redirect (handled in useEffect)
  if (!user) {
    return null
  }

  // If no profile, show error
  if (!userProfile) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">
            {error || 'Please complete your profile before creating a fraternity'}
          </p>
          <Button
            onClick={() => router.push('/onboarding')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Complete Profile
          </Button>
        </Card>
      </main>
    )
  }

  // Check if user has verified email and completed profile (required for creating fraternity)
  if (!userProfile.email_verified || !userProfile.name || !userProfile.year || !userProfile.gender || !userProfile.school) {
    return (
      <main className="min-h-screen w-screen bg-white flex items-center justify-center px-6">
        <Card className="text-center max-w-md w-full">
          <p className="text-bodySmall text-error mb-4">
            You must have a verified email and completed profile to create a fraternity
          </p>
          <Button
            onClick={() => router.push('/onboarding')}
            variant="primary"
            size="large"
            className="w-full"
          >
            Complete Profile
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="mb-6">
          <h1 className="text-heading1 text-neutral-black mb-2">
            Create Fraternity
          </h1>
          <p className="text-bodySmall text-gray-medium">
            Create a new fraternity or sorority group. You'll become an admin automatically.
          </p>
        </div>

        <Card>
          <FraternityForm
            schoolId={userProfile.school_id || null}
            userId={user.id}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
          />
        </Card>
      </div>
    </main>
  )
}
