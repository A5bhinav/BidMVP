// app/onboarding/campus/page.js
// Campus selection page - appears after profile setup
// Auto-detects campus from email and allows manual selection if needed

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { detectCampus, linkCampus, getCampus, searchSchoolsAction, linkUserToSchoolAction, getSchoolByDomainAction } from '@/app/actions/profile'
import CampusSelector from '@/components/CampusSelector'
import Card from '@/components/ui/Card'

export default function CampusSelectionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [detecting, setDetecting] = useState(true)
  const [detectedCampus, setDetectedCampus] = useState(null)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState(null)

  // Check authentication and existing campus on mount
  useEffect(() => {
    const initialize = async () => {
      if (authLoading) return

      // Check if user is authenticated
      if (!user) {
        router.push('/')
        return
      }

      // Check if user already has a campus linked
      try {
        const { data: existingCampus, error: campusError } = await getCampus(user.id)
        
        if (campusError) {
          console.error('Error checking existing campus:', campusError)
          // Continue with detection even if check fails
        } else if (existingCampus) {
          // User already has a campus, redirect to welcome
          const returnTo = searchParams.get('returnTo') || '/welcome'
          router.push(returnTo)
          return
        }
      } catch (err) {
        console.error('Error checking campus:', err)
        // Continue with detection
      }

      // Auto-detect campus from email
      if (user.email) {
        await detectCampusFromEmail()
      } else {
        setError('Email not available')
        setDetecting(false)
      }
    }

    initialize()
  }, [user, authLoading, router, searchParams])

  // Auto-detect campus from email
  const detectCampusFromEmail = async () => {
    if (!user?.email) {
      setError('Email not available')
      setDetecting(false)
      return
    }

    setDetecting(true)
    setError(null)

    try {
      // Get domain from email
      const { domain, error: detectError } = await detectCampus(user.email)

      if (detectError || !domain) {
        // Don't show error - just show search UI
        setDetectedCampus(null)
        setDetecting(false)
        return
      }

      // Try to get school by domain
      const { data: existingSchool, error: schoolError } = await getSchoolByDomainAction(domain)

      if (existingSchool) {
        setDetectedCampus({
          id: existingSchool.id,
          name: existingSchool.name,
          domain: existingSchool.domain,
          abbreviation: existingSchool.abbreviation
        })
      } else {
        // School doesn't exist yet - show preview with domain
        // It will be created when user confirms
        setDetectedCampus({
          id: null, // Will be created when linking
          name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' University',
          domain: domain,
          abbreviation: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
        })
      }
      setDetecting(false)
    } catch (err) {
      console.error('Error detecting campus:', err)
      // Don't show error - just show search UI
      setDetectedCampus(null)
      setDetecting(false)
    }
  }

  // Handle confirming auto-detected campus
  const handleConfirmDetected = async () => {
    if (!user?.id || !user?.email) {
      setError('User information not available')
      return
    }

    setLinking(true)
    setError(null)

    try {
      const { data, error: linkError } = await linkCampus(user.id, user.email)

      if (linkError) {
        setError(linkError.message || 'Failed to link campus')
        setLinking(false)
        return
      }

      if (data?.school) {
        // Successfully linked
        const returnTo = searchParams.get('returnTo') || '/welcome'
        router.push(returnTo)
      } else {
        setError('Failed to link campus')
        setLinking(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to link campus')
      setLinking(false)
    }
  }

  // Handle manual school selection
  const handleSelectSchool = async (schoolId) => {
    if (!user?.id || !schoolId) {
      setError('Invalid selection')
      return
    }

    setLinking(true)
    setError(null)

    try {
      const { data, error: linkError } = await linkUserToSchoolAction(user.id, schoolId)

      if (linkError) {
        setError(linkError.message || 'Failed to link campus')
        setLinking(false)
        return
      }

      if (data?.success) {
        // Successfully linked
        const returnTo = searchParams.get('returnTo') || '/welcome'
        router.push(returnTo)
      } else {
        setError('Failed to link campus')
        setLinking(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to link campus')
      setLinking(false)
    }
  }

  // Handle search
  const handleSearch = async (query, limit = 15) => {
    return await searchSchoolsAction(query, limit)
  }

  // Show loading state
  if (authLoading || detecting) {
    return (
      <main className="h-screen w-screen bg-white flex items-center justify-center">
        <Card className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto mb-4"></div>
          <p className="text-bodySmall text-gray-medium">
            {detecting ? 'Detecting your campus...' : 'Loading...'}
          </p>
        </Card>
      </main>
    )
  }

  // If not logged in, this will redirect (handled in useEffect)
  if (!user) {
    return null
  }

  // Show campus selector
  return (
    <main className="min-h-screen w-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12">
        <Card>
          <div className="mb-8">
            <h1 className="text-heading1 text-neutral-black mb-2">
              Select Your Campus
            </h1>
            <p className="text-bodySmall text-gray-medium">
              We'll use this to connect you with events at your school
            </p>
          </div>

          <CampusSelector
            detectedCampus={detectedCampus}
            onSelect={handleSelectSchool}
            onConfirm={handleConfirmDetected}
            loading={linking}
            error={error}
            onSearch={handleSearch}
          />
        </Card>
      </div>
    </main>
  )
}

