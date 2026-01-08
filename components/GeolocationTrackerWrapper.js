'use client'

import { useState, useEffect } from 'react'
import GeolocationTracker from './GeolocationTracker'
import Button from './ui/Button'

export default function GeolocationTrackerWrapper({
  eventId,
  userId,
  eventLocation,
  radius = 150,
  onCheckOut,
  onError
}) {
  const [locationPermission, setLocationPermission] = useState(null) // 'granted', 'denied', 'prompt', null
  const [isRequesting, setIsRequesting] = useState(false)

  // Check permission status on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied')
      return
    }

    // Check permission status without requesting
    navigator.permissions?.query({ name: 'geolocation' })
      .then(permission => {
        setLocationPermission(permission.state)
        // Listen for permission changes
        permission.onchange = () => {
          setLocationPermission(permission.state)
        }
      })
      .catch(() => {
        // Permissions API not supported - that's okay
        setLocationPermission('prompt')
      })
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)

    if (!navigator.geolocation) {
      onError?.(new Error('Geolocation is not supported by your browser'))
      setLocationPermission('denied')
      setIsRequesting(false)
      return
    }

    try {
      // Request location (this will trigger browser prompt)
      // This is called from a user button click, so it's allowed
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permission granted
          setLocationPermission('granted')
          setIsRequesting(false)
          // The tracker will start automatically when permission is granted
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied')
            onError?.(new Error('Location access denied. Manual check-out will be required.'))
          } else {
            onError?.(new Error('Failed to get location'))
          }
          setIsRequesting(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (err) {
      onError?.(new Error('Failed to request location permission'))
      setIsRequesting(false)
    }
  }

  // If permission is granted, show the tracker
  if (locationPermission === 'granted') {
    return (
      <GeolocationTracker
        eventId={eventId}
        userId={userId}
        eventLocation={eventLocation}
        radius={radius}
        onCheckOut={onCheckOut}
        onError={onError}
      />
    )
  }

  // If permission is denied, show message
  if (locationPermission === 'denied') {
    return (
      <p className="text-sm text-yellow-600">
        ⚠️ Location denied - manual check-out required
      </p>
    )
  }

  // Show button to request permission
  return (
    <div>
      <p className="text-bodySmall text-gray-medium mb-3">
        Enable location tracking for automatic check-out when you leave the event area.
      </p>
      <Button
        variant="primary"
        onClick={handleRequestPermission}
        disabled={isRequesting}
      >
        {isRequesting ? 'Requesting...' : 'Enable Location Tracking'}
      </Button>
    </div>
  )
}

