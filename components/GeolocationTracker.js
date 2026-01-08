'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { trackUserLocationAction, checkUserInRadiusAction, autoCheckOutAction } from '@/app/actions/checkin'

export default function GeolocationTracker({ 
  eventId, 
  userId, 
  eventLocation, 
  radius = 150, // 150 meters default
  onCheckOut,
  onError 
}) {
  const [locationPermission, setLocationPermission] = useState(null) // 'granted', 'denied', 'prompt'
  const [isTracking, setIsTracking] = useState(false)
  const [outsideRadiusSince, setOutsideRadiusSince] = useState(null) // Timestamp when user left radius
  const trackingIntervalRef = useRef(null)
  const watchIdRef = useRef(null)

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }, [])

  const trackLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Store location
        await trackUserLocationAction(eventId, userId, latitude, longitude)

        // Check if in radius
        const { data: radiusCheck, error } = await checkUserInRadiusAction(
          eventId, 
          userId, 
          latitude, 
          longitude
        )

        if (error) {
          console.error('Error checking radius:', error)
          return
        }

        if (!radiusCheck?.inRadius) {
          // User is outside radius
          setOutsideRadiusSince(prev => {
            const now = Date.now()
            if (!prev) {
              // First time outside - record timestamp
              return now
            } else {
              // Check if outside for 5+ minutes
              const timeOutside = (now - prev) / 1000 / 60 // minutes
              if (timeOutside >= 5) {
                // Auto check-out (use setTimeout to avoid calling async in setState)
                setTimeout(() => {
                  autoCheckOutAction(eventId, userId).then(({ error: checkoutError }) => {
                    if (!checkoutError) {
                      onCheckOut?.()
                      stopTracking()
                    }
                  })
                }, 0)
              }
              return prev // Keep the original timestamp
            }
          })
        } else {
          // User is back in radius - reset timer
          setOutsideRadiusSince(null)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied')
          onError?.(new Error('Location access denied. Manual check-out will be required.'))
          stopTracking()
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }, [eventId, userId, onCheckOut, onError, stopTracking])

  const startTracking = useCallback(() => {
    if (isTracking) return

    setIsTracking(true)
    
    // Track location every 45 seconds
    trackingIntervalRef.current = setInterval(() => {
      trackLocation()
    }, 45000) // 45 seconds

    // Initial track
    trackLocation()
  }, [isTracking, trackLocation])

  // Request location permission (called by user button click)
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      onError?.(new Error('Geolocation is not supported by your browser'))
      setLocationPermission('denied')
      return false
    }

    try {
      // Check current permission status
      let permissionState = 'prompt'
      try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
        permissionState = permission.state
      setLocationPermission(permission.state)

      // Listen for permission changes
      permission.onchange = () => {
        setLocationPermission(permission.state)
        if (permission.state === 'granted') {
          startTracking()
        } else {
          stopTracking()
        }
      }
      } catch {
        // Permissions API not supported - that's okay
      }

      // Request location (this will trigger browser prompt if needed)
      // This is called from a user button click, so it's allowed
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permission granted - start tracking
          setLocationPermission('granted')
          startTracking()
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied')
            onError?.(new Error('Location access denied. Manual check-out will be required.'))
          } else {
            onError?.(new Error('Failed to get location'))
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
      return true
    } catch (err) {
      onError?.(new Error('Failed to request location permission'))
      return false
    }
  }, [startTracking, stopTracking, onError])

  // Check permission status on mount (but don't request)
  useEffect(() => {
    if (!navigator.geolocation) return

    // Check permission status without requesting
    navigator.permissions?.query({ name: 'geolocation' })
      .then(permission => {
        setLocationPermission(permission.state)
        // If already granted, start tracking automatically
        if (permission.state === 'granted') {
          startTracking()
        }
        // Listen for permission changes
        permission.onchange = () => {
          setLocationPermission(permission.state)
          if (permission.state === 'granted') {
            startTracking()
          } else {
            stopTracking()
          }
        }
      })
      .catch(() => {
        // Permissions API not supported - that's okay
      })
    
    return () => {
      // Cleanup: stop tracking when component unmounts
      stopTracking()
    }
  }, [eventId, userId, eventLocation, startTracking, stopTracking])

  // Render tracking status
  return (
    <div className="text-sm text-gray-medium">
      {locationPermission === 'granted' && isTracking && (
        <p className="text-success">📍 Location tracking active</p>
      )}
      {locationPermission === 'denied' && (
        <p className="text-yellow-600">⚠️ Location denied - manual check-out required</p>
      )}
    </div>
  )
}
