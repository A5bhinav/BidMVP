---
name: Phase 1.3 Frontend - QR Code Check-In System
overview: Frontend implementation plan for QR code check-in system including QR scanner, user QR display, real-time check-in list, and check-out functionality.
---

# Phase 1.3 Frontend: QR Code Check-In System

## Overview

This document details the frontend implementation for the QR code check-in system. The frontend handles:
- User QR code display
- Host QR code scanning
- Real-time check-in list updates
- **Automatic geolocation-based check-out (PRIMARY METHOD)**
- Manual check-out as fallback option
- Camera permissions and error handling
- Location permissions and tracking

## Key Concepts

### QR Code Format

**Important:** There are two types of QR codes in the system, but Phase 1.3 only uses **User QR Codes**:

1. **Event QR Code** (Phase 1.1 - NOT used in Phase 1.3):
   - Stored in `event.qr_code` field in database
   - Format: `event-${eventId}-${randomSuffix}`
   - Generated when event is created
   - Purpose: Event identification and future features (sharing, quick access, etc.)
   - **Not used for check-in** - ignore this for Phase 1.3
   - Can optionally be displayed on event pages for sharing (not required)

2. **User QR Code** (Phase 1.3 - THIS IS WHAT WE'RE BUILDING):
   - Format: `user-${userId}-${eventId}`
   - Generated on-the-fly in frontend (not stored in database)
   - Displayed as QR code image using `qrcode` package
   - Scanned by hosts using camera
   - **Used for check-in** - this is what hosts scan to check users into events

### Real-time Updates

- Use Supabase Realtime subscriptions
- Subscribe to `checkin` table changes
- Filter: `event_id=eq.${eventId} AND is_checked_in=eq.true`
- Update UI automatically when check-ins occur

### User Flow

1. **User Flow:**
   - User opens QR display page (`/events/[id]/qr`)
   - System generates QR code: `user-${userId}-${eventId}`
   - User displays QR code to host

2. **Host Flow:**
   - Host opens scanner page (`/events/[id]/checkin`)
   - Host scans user's QR code
   - System validates and checks user in
   - Check-in list updates in real-time

---

## Implementation Files

### File: `app/events/[id]/checkin/page.js`

**Purpose:** Host-facing QR scanner and check-in management page

**Route:** `/events/[id]/checkin`

**Features:**
- Camera-based QR code scanner
- Real-time check-in list
- Manual check-out buttons
- Search/filter attendees
- User info display (name, photo, check-in time)
- Error handling for invalid QR codes
- Camera permission handling

**State Management:**

```javascript
const [checkedInUsers, setCheckedInUsers] = useState([])
const [scanning, setScanning] = useState(false)
const [scanError, setScanError] = useState(null)
const [scanSuccess, setScanSuccess] = useState(false)
const [loading, setLoading] = useState(true)
const [event, setEvent] = useState(null)
const [isAdmin, setIsAdmin] = useState(false)
const [searchQuery, setSearchQuery] = useState('')
```

**Real-time Subscription Setup:**

```javascript
useEffect(() => {
  if (!eventId || !isAdmin) return

  const supabase = createClient()
  
  const channel = supabase
    .channel(`checkin-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'checkin',
        filter: `event_id=eq.${eventId}`
      },
      (payload) => {
        // Handle real-time update
        if (payload.eventType === 'INSERT' && payload.new.is_checked_in) {
          // Add new check-in to list
          setCheckedInUsers(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          // Update existing check-in
          if (payload.new.is_checked_in) {
            setCheckedInUsers(prev => 
              prev.map(ci => ci.id === payload.new.id ? payload.new : ci)
            )
          } else {
            // User checked out
            setCheckedInUsers(prev => 
              prev.filter(ci => ci.id !== payload.new.id)
            )
          }
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [eventId, isAdmin])
```

**QR Scanner Integration:**

```javascript
const handleQRScan = async (qrCode) => {
  setScanError(null)
  setScanSuccess(false)
  
  try {
    // Extract userId and eventId from QR code
    // Format: user-${userId}-${eventId}
    const match = qrCode.match(/^user-(.+?)-(.+)$/)
    if (!match) {
      setScanError('Invalid QR code format')
      return
    }
    
    const [, userId, eventIdFromQR] = match
    
    // Verify eventId matches current event
    if (eventIdFromQR !== eventId) {
      setScanError('QR code is for a different event')
      return
    }
    
    // Call check-in API
    const { data, error } = await checkInUserAction(
      eventId,
      userId,
      qrCode,
      user.id
    )
    
    if (error) {
      setScanError(error.message)
    } else {
      setScanSuccess(true)
      // Real-time subscription will update the list
      setTimeout(() => setScanSuccess(false), 2000)
    }
  } catch (err) {
    setScanError(err.message || 'Failed to check in user')
  }
}
```

**UI Structure:**

```jsx
<div className="min-h-screen bg-gray-bg">
  {/* Header */}
  <div className="sticky top-0 z-10 bg-white border-b">
    <h1>Check-In Scanner</h1>
  </div>

  {/* Scanner Section */}
  <div className="p-4">
    <QRScanner
      onScan={handleQRScan}
      onError={(err) => setScanError(err.message)}
      scanning={scanning}
    />
    
    {scanSuccess && (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-600">User checked in successfully!</p>
      </div>
    )}
    
    {scanError && (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">{scanError}</p>
      </div>
    )}
  </div>

  {/* Check-In List */}
  <div className="p-4">
    <h2>Checked-In Attendees ({checkedInUsers.length})</h2>
    <Input
      type="text"
      placeholder="Search attendees..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <CheckInList
      eventId={eventId}
      adminUserId={user.id}
      onCheckOut={handleCheckOut}
    />
  </div>
</div>
```

**Key Implementation Details:**
- Use `'use client'` directive
- Import `useAuth` from `@/contexts/AuthContext`
- Import `checkInUserAction` from `@/app/actions/checkin` (to be created)
- Import `CheckInList` and `QRScanner` components
- Handle camera permissions gracefully
- Show loading states during API calls
- Display error messages clearly

---

### File: `app/events/[id]/qr/page.js`

**Purpose:** User-facing QR code display page with automatic geolocation tracking

**Route:** `/events/[id]/qr`

**Features:**
- Display user's QR code for the event
- Show event info (title, date, location)
- Show check-in status
- Large, scannable QR code
- **Request location permission when user checks in**
- **Start automatic geolocation tracking after check-in**
- Instructions for user

**QR Code Generation:**

```javascript
import QRCode from 'qrcode'

const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null)
const [checkInStatus, setCheckInStatus] = useState(null)

useEffect(() => {
  if (!user?.id || !eventId) return

  // Generate QR code string
  const qrCodeString = `user-${user.id}-${eventId}`
  
  // Convert to QR code image
  QRCode.toDataURL(qrCodeString, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })
    .then(url => setQrCodeDataUrl(url))
    .catch(err => console.error('Error generating QR code:', err))
  
  // Check if user is already checked in
  checkCheckInStatus()
}, [user?.id, eventId])

const checkCheckInStatus = async () => {
  const { data, error } = await isUserCheckedInAction(eventId, user.id)
  if (!error && data) {
    setCheckInStatus(data)
  }
}
```

**UI Structure:**

```jsx
<div className="min-h-screen bg-gray-bg p-4">
  {/* Event Info */}
  {event && (
    <Card className="mb-4">
      <h2 className="text-xl font-semibold">{event.title}</h2>
      <p className="text-gray-medium">{formatDate(event.date)}</p>
      {event.location && (
        <p className="text-gray-medium">{event.location}</p>
      )}
    </Card>
  )}

  {/* QR Code Display */}
  <Card className="p-8 text-center">
    {qrCodeDataUrl ? (
      <>
        <img
          src={qrCodeDataUrl}
          alt="Your QR Code"
          className="mx-auto mb-4"
          style={{ maxWidth: '300px', width: '100%' }}
        />
        <p className="text-bodySmall text-gray-medium mb-2">
          Show this QR code to the host
        </p>
        {checkInStatus && (
          <Badge variant="success">
            Checked in at {formatTime(checkInStatus.checked_in_at)}
          </Badge>
        )}
      </>
    ) : (
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-ui border-t-transparent mx-auto"></div>
    )}
  </Card>

  {/* Instructions */}
  <Card className="mt-4">
    <h3 className="font-semibold mb-2">How to use:</h3>
    <ol className="list-decimal list-inside space-y-2 text-bodySmall text-gray-medium">
      <li>Show this QR code to the event host</li>
      <li>The host will scan it to check you in</li>
      <li>Keep this page open until you're checked in</li>
    </ol>
  </Card>
</div>
```

**Geolocation Tracking Integration:**

```javascript
import GeolocationTracker from '@/components/GeolocationTracker'

// After user is checked in, start geolocation tracking
// Note: event.location is now REQUIRED, so this should always be available
{checkInStatus && checkInStatus.is_checked_in && event.location && (
  <GeolocationTracker
    eventId={eventId}
    userId={user.id}
    eventLocation={parseEventLocation(event.location)} // Geocode address to lat/lng or parse coordinates
    radius={150} // 150 meters
    onCheckOut={() => {
      // Update check-in status
      checkCheckInStatus()
      // Show notification
      alert('You have been automatically checked out')
    }}
    onError={(error) => {
      console.error('Geolocation error:', error)
      // Show fallback message
    }}
  />
)}
```

**Note:** Event location is now REQUIRED when creating events, so `event.location` should always be available.

**Key Implementation Details:**
- Use `qrcode` package (already installed)
- Generate QR code on component mount
- Check check-in status on load
- **Start geolocation tracking when user is checked in**
- **Request location permission with clear explanation**
- Handle loading states
- Show clear instructions to user
- Display event information
- Show geolocation tracking status
- **Note:** Event location is now REQUIRED when creating events, so `event.location` will always be available

---

### File: `components/QRScanner.js`

**Purpose:** Reusable camera-based QR scanner component

**Features:**
- Camera access and permission handling
- QR code scanning
- Success/error callbacks
- Loading states
- Camera toggle (front/back)
- Flashlight toggle (if available)

**Implementation Options:**

**Option 1: Use `html5-qrcode` library (Recommended)**

```bash
npm install html5-qrcode
```

```javascript
'use client'

import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

export default function QRScanner({ onScan, onError, scanning }) {
  const [cameraId, setCameraId] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    if (!scanning) return

    const html5QrCode = new Html5Qrcode('qr-scanner')
    html5QrCodeRef.current = html5QrCode

    // Request camera permission
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameraId(devices[0].id)
          setHasPermission(true)
          
          // Start scanning
          html5QrCode.start(
            devices[0].id,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // QR code scanned
              onScan(decodedText)
              // Stop scanning after successful scan
              html5QrCode.stop()
            },
            (errorMessage) => {
              // Ignore errors (continuous scanning)
            }
          )
        }
      })
      .catch(err => {
        setHasPermission(false)
        onError(new Error('Camera access denied'))
      })

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [scanning, onScan, onError])

  if (hasPermission === false) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">Camera access denied</p>
        <p className="text-sm text-red-500 mt-2">
          Please enable camera permissions to scan QR codes
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div id="qr-scanner" className="w-full aspect-square bg-black rounded-lg"></div>
      {scanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-primary-ui rounded-lg w-64 h-64"></div>
        </div>
      )}
    </div>
  )
}
```

**Option 2: Use `jsQR` with MediaDevices API**

```bash
npm install jsqr
```

```javascript
'use client'

import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'

export default function QRScanner({ onScan, onError, scanning }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [hasPermission, setHasPermission] = useState(null)

  useEffect(() => {
    if (!scanning) {
      // Stop camera when not scanning
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream
        video.srcObject = stream
        video.play()
        setHasPermission(true)

        // Scan for QR codes
        const scanQR = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)

            if (code) {
              onScan(code.data)
              // Stop scanning after successful scan
              stream.getTracks().forEach(track => track.stop())
            } else if (scanning) {
              requestAnimationFrame(scanQR)
            }
          } else {
            requestAnimationFrame(scanQR)
          }
        }

        scanQR()
      })
      .catch(err => {
        setHasPermission(false)
        onError(new Error('Camera access denied'))
      })

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [scanning, onScan, onError])

  // ... render UI
}
```

**Props:**
- `onScan: (qrCode: string) => void` - Called when QR code is scanned
- `onError: (error: Error) => void` - Called on scan errors
- `scanning: boolean` - Whether scanner is active

**Key Implementation Details:**
- Handle camera permissions gracefully
- Show clear error messages
- Stop camera when component unmounts
- Provide visual feedback (scanning overlay)
- Support both front and back cameras (mobile)

---

### File: `components/CheckInList.js`

**Purpose:** Live attendee list component with real-time updates

**Features:**
- Display list of checked-in users
- Real-time updates via Supabase Realtime
- User cards with photo, name, check-in time
- Manual check-out buttons
- Search/filter functionality
- Empty state

**Props:**
```javascript
{
  eventId: string,
  adminUserId: string,
  onCheckOut: (userId: string) => void
}
```

**Implementation:**

```javascript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCheckedInUsersAction } from '@/app/actions/checkin'
import ManualCheckOut from './ManualCheckOut'
import Avatar from './ui/Avatar'
import Card from './ui/Card'

export default function CheckInList({ eventId, adminUserId, onCheckOut }) {
  const [checkedInUsers, setCheckedInUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Load initial check-ins
  useEffect(() => {
    loadCheckedInUsers()
  }, [eventId, adminUserId])

  // Real-time subscription
  useEffect(() => {
    if (!eventId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`checkin-list-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkin',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.is_checked_in) {
            // Add new check-in
            setCheckedInUsers(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_checked_in) {
              // Update existing
              setCheckedInUsers(prev => 
                prev.map(ci => ci.id === payload.new.id ? payload.new : ci)
              )
            } else {
              // Remove checked-out user
              setCheckedInUsers(prev => 
                prev.filter(ci => ci.id !== payload.new.id)
              )
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  const loadCheckedInUsers = async () => {
    setLoading(true)
    const { data, error } = await getCheckedInUsersAction(eventId, adminUserId)
    if (!error && data) {
      setCheckedInUsers(data)
    }
    setLoading(false)
  }

  const filteredUsers = checkedInUsers.filter(user => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      user.user?.name?.toLowerCase().includes(query) ||
      user.user?.email?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (filteredUsers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-medium">
          {searchQuery ? 'No attendees match your search' : 'No attendees checked in yet'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {filteredUsers.map((checkIn) => (
        <Card key={checkIn.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={checkIn.user?.profile_pic}
                name={checkIn.user?.name}
                size="medium"
              />
              <div>
                <p className="font-medium">{checkIn.user?.name}</p>
                <p className="text-sm text-gray-medium">
                  Checked in {formatTime(checkIn.checked_in_at)}
                </p>
              </div>
            </div>
            <ManualCheckOut
              eventId={eventId}
              userId={checkIn.user_id}
              adminUserId={adminUserId}
              onSuccess={() => {
                onCheckOut(checkIn.user_id)
                setCheckedInUsers(prev => 
                  prev.filter(ci => ci.id !== checkIn.id)
                )
              }}
            />
          </div>
        </Card>
      ))}
    </div>
  )
}
```

**Key Implementation Details:**
- Use real-time subscriptions for live updates
- Filter by search query
- Display user profile info
- Show check-in time
- Handle empty states
- Integrate with ManualCheckOut component

---

### File: `components/GeolocationTracker.js`

**Purpose:** Automatic geolocation tracking and check-out component (PRIMARY METHOD)

**Features:**
- Request location permission
- Track user location periodically (every 30-60 seconds)
- Check if user is within event radius
- Automatically check out user when they leave radius for 5+ minutes
- Handle location permission denied gracefully
- Show tracking status to user

**Props:**
```javascript
{
  eventId: string,
  userId: string,
  eventLocation: {lat: number, lng: number}, // Parsed from event.location
  radius: number, // Default: 100-200 meters
  onCheckOut: () => void, // Called when auto check-out occurs
  onError: (error: Error) => void
}
```

**Implementation:**

```javascript
'use client'

import { useEffect, useRef, useState } from 'react'
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

  // Request location permission and start tracking
  useEffect(() => {
    if (!eventId || !userId || !eventLocation) return

    requestLocationPermission()
    
    return () => {
      // Cleanup: stop tracking when component unmounts
      stopTracking()
    }
  }, [eventId, userId, eventLocation])

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported by your browser'))
      setLocationPermission('denied')
      return
    }

    try {
      // Request permission
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      setLocationPermission(permission.state)

      if (permission.state === 'granted' || permission.state === 'prompt') {
        startTracking()
      } else {
        onError(new Error('Location permission denied. Manual check-out will be required.'))
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
    } catch (err) {
      // Fallback: try to get location directly (will prompt user)
      startTracking()
    }
  }

  const startTracking = () => {
    if (isTracking) return

    setIsTracking(true)
    
    // Track location every 30-60 seconds
    trackingIntervalRef.current = setInterval(() => {
      trackLocation()
    }, 45000) // 45 seconds

    // Initial track
    trackLocation()
  }

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  const trackLocation = () => {
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

        if (!radiusCheck.inRadius) {
          // User is outside radius
          if (!outsideRadiusSince) {
            // First time outside - record timestamp
            setOutsideRadiusSince(Date.now())
          } else {
            // Check if outside for 5+ minutes
            const timeOutside = (Date.now() - outsideRadiusSince) / 1000 / 60 // minutes
            if (timeOutside >= 5) {
              // Auto check-out
              await autoCheckOutAction(eventId, userId)
              onCheckOut()
              stopTracking()
            }
          }
        } else {
          // User is back in radius - reset timer
          setOutsideRadiusSince(null)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied')
          onError(new Error('Location access denied. Manual check-out will be required.'))
          stopTracking()
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return (
    <div className="text-sm text-gray-medium">
      {locationPermission === 'granted' && isTracking && (
        <p>📍 Location tracking active</p>
      )}
      {locationPermission === 'denied' && (
        <p className="text-yellow-600">⚠️ Location denied - manual check-out required</p>
      )}
    </div>
  )
}
```

**Key Implementation Details:**
- Request location permission when user checks in
- Track location every 30-60 seconds (balance between accuracy and battery)
- Check radius on each location update
- Track time outside radius (5 minute threshold)
- Auto check-out when threshold exceeded
- Handle permission denied gracefully (fallback to manual)
- Clean up tracking on unmount
- Show tracking status to user

---

### File: `components/ManualCheckOut.js`

**Purpose:** Manual check-out button component (FALLBACK OPTION)

**Features:**
- Button to manually check out a user
- **Only shown as fallback when geolocation fails**
- Loading state during check-out
- Success/error handling
- Confirmation dialog (optional)

**Note:** This is now a **fallback option** for edge cases:
- User denied location permission
- User's phone battery died
- Poor GPS signal
- Other technical issues

**Props:**
```javascript
{
  eventId: string,
  userId: string,
  adminUserId: string,
  onSuccess: () => void,
  onError?: (error: Error) => void
}
```

**Implementation:**

```javascript
'use client'

import { useState } from 'react'
import { checkOutUserAction } from '@/app/actions/checkin'
import Button from './ui/Button'

export default function ManualCheckOut({ 
  eventId, 
  userId, 
  adminUserId, 
  onSuccess,
  onError 
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const { error } = await checkOutUserAction(eventId, userId, adminUserId)
      if (error) {
        onError?.(new Error(error.message))
      } else {
        onSuccess()
      }
    } catch (err) {
      onError?.(err)
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="small"
          onClick={handleCheckOut}
          disabled={loading}
        >
          {loading ? 'Checking out...' : 'Confirm'}
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="secondary"
      size="small"
      onClick={() => setShowConfirm(true)}
    >
      Check Out
    </Button>
  )
}
```

**Key Implementation Details:**
- Show confirmation before check-out
- Handle loading states
- Call success/error callbacks
- Disable button during operation

---

## Server Actions

### File: `app/actions/checkin.js`

**Purpose:** Server actions for check-in operations and geolocation tracking

**Functions to create:**

```javascript
'use server'

import { 
  checkInUser, 
  checkOutUser, 
  getCheckedInUsers, 
  isUserCheckedIn 
} from '@/lib/supabase/checkin'
import {
  trackUserLocation,
  checkUserInRadius,
  autoCheckOut
} from '@/lib/location/tracker'

export async function checkInUserAction(eventId, userId, qrCode, adminUserId) {
  return await checkInUser(eventId, userId, qrCode, adminUserId)
}

export async function checkOutUserAction(eventId, userId, adminUserId) {
  return await checkOutUser(eventId, userId, adminUserId)
}

export async function getCheckedInUsersAction(eventId, adminUserId) {
  return await getCheckedInUsers(eventId, adminUserId)
}

export async function isUserCheckedInAction(eventId, userId) {
  return await isUserCheckedIn(eventId, userId)
}

// Geolocation tracking actions
export async function trackUserLocationAction(eventId, userId, latitude, longitude) {
  return await trackUserLocation(eventId, userId, latitude, longitude)
}

export async function checkUserInRadiusAction(eventId, userId, latitude, longitude) {
  return await checkUserInRadius(eventId, userId, latitude, longitude)
}

export async function autoCheckOutAction(eventId, userId) {
  return await autoCheckOut(eventId, userId)
}
```

---

## Real-time Subscription Pattern

**Setup Pattern:**

```javascript
useEffect(() => {
  if (!eventId) return

  const supabase = createClient()
  
  const channel = supabase
    .channel(`unique-channel-name-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
        schema: 'public',
        table: 'checkin',
        filter: `event_id=eq.${eventId} AND is_checked_in=eq.true`
      },
      (payload) => {
        // Handle update
        console.log('Change received!', payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [eventId])
```

**Important:**
- Use unique channel names per component
- Clean up subscriptions on unmount
- Filter appropriately to reduce noise
- Handle all event types (INSERT, UPDATE, DELETE)

---

## Dependencies

**Already Installed:**
- `qrcode` - QR code image generation
- `@supabase/supabase-js` - Real-time subscriptions

**Need to Install:**
```bash
npm install html5-qrcode
# OR
npm install jsqr
```

**Recommendation:** Use `html5-qrcode` for better browser compatibility and easier setup.

---

## Testing Checklist

### Frontend Component Tests

- [ ] QR scanner accesses camera correctly
- [ ] QR code generation displays correctly
- [ ] Check-in list updates in real-time
- [ ] **Geolocation permission request works**
- [ ] **Location tracking starts after check-in**
- [ ] **Automatic check-out works when user leaves radius**
- [ ] **Time threshold (5 minutes) works correctly**
- [ ] **Radius checking calculates distance correctly**
- [ ] Manual check-out works (fallback)
- [ ] Error states display correctly
- [ ] Loading states show during API calls
- [ ] Permission denied states handled gracefully (falls back to manual)
- [ ] Search/filter works correctly
- [ ] Empty states display correctly

### Integration Tests

- [ ] End-to-end check-in flow works
- [ ] User can display QR code
- [ ] Host can scan and check in user
- [ ] Check-in list updates immediately
- [ ] Check-out removes user from list
- [ ] Real-time updates work across multiple devices
- [ ] Camera permissions handled correctly

---

## File Structure

```
app/
  events/
    [id]/
      checkin/
        page.js         # Host scanner page
      qr/
        page.js         # User QR display page
  actions/
    checkin.js          # Server actions

components/
  QRScanner.js          # Camera-based QR scanner
  CheckInList.js        # Live attendee list
  GeolocationTracker.js # Automatic geolocation tracking and check-out (PRIMARY)
  ManualCheckOut.js     # Manual check-out button (FALLBACK)
```

---

## Next Steps

1. **Update EventForm to require location field** (mark as required, add validation)
2. Install QR scanning library (`html5-qrcode` recommended)
3. Create server actions file
4. Implement QR scanner component
5. Implement user QR display page with geolocation tracking
6. Implement host scanner page
7. Implement check-in list component
8. Implement GeolocationTracker component (automatic check-out)
9. Implement ManualCheckOut component (fallback)
10. Test real-time subscriptions
11. Test geolocation tracking and automatic check-out
12. Test end-to-end flow
13. Handle edge cases and errors

## Event Form Update Required

**IMPORTANT:** The `EventForm` component must be updated to make location a required field.

**Current State:** Location is optional
**Required Change:** Location is now mandatory

**Validation Changes in `components/EventForm.js`:**

```javascript
// OLD (Phase 1.1):
// Location validation (optional, but check max length)
if (location && location.trim().length > 200) {
  errors.location = 'Location must be 200 characters or less'
}

// NEW (Phase 1.3):
// Location validation (REQUIRED for automatic check-out)
if (!location || !location.trim()) {
  errors.location = 'Location is required for automatic check-out'
} else if (location.trim().length > 200) {
  errors.location = 'Location must be 200 characters or less'
}
```

**UI Changes:**
- Mark location input field as required (add `required` attribute or `*` indicator)
- Update placeholder text: "Event address (required for automatic check-out)"
- Show helpful text: "Enter event address (e.g., '123 Main St, Berkeley, CA') for automatic check-out"
- Update form validation to prevent submission without location
- Note: Address will be geocoded to coordinates for automatic check-out functionality

