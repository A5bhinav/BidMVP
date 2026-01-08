'use client'

import { useState, useEffect } from 'react'
import { getProfile } from '@/app/actions/profile'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import Card from './ui/Card'

export default function CheckInConfirmationModal({ 
  isOpen, 
  userId, 
  onConfirm, 
  onCancel 
}) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadUserInfo()
    } else {
      // Reset state when modal closes
      setUserInfo(null)
      setError(null)
    }
  }, [isOpen, userId])

  const loadUserInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: profileError } = await getProfile(userId)
      if (profileError || !data) {
        setError('Could not load user information')
      } else {
        setUserInfo(data)
      }
    } catch (err) {
      setError('Failed to load user information')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-ui border-t-transparent mx-auto"></div>
            <p className="text-gray-medium mt-4">Loading user info...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="secondary" onClick={onCancel}>
              Close
            </Button>
          </div>
        ) : userInfo ? (
          <>
            <div className="text-center mb-6">
              <Avatar
                src={userInfo.profile_pic}
                alt={userInfo.name || 'User'}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="text-xl font-bold text-neutral-black mb-2">
                {userInfo.name || 'Unknown User'}
              </h2>
              <p className="text-bodySmall text-gray-medium mb-4">
                Verify this is the person before checking them in
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onConfirm}
                className="flex-1"
              >
                Check In
              </Button>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  )
}

