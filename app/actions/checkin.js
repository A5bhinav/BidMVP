// app/actions/checkin.js
// Server Actions for check-in operations and geolocation tracking
// These wrap the backend functions and can be called from client components

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
import { createClient } from '@/lib/supabase/server'

/**
 * Get current user ID from auth context
 */
async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

// ============================================
// Check-In Actions
// ============================================

/**
 * Check a user into an event via QR code scan
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to check in
 * @param {string} qrCode - Scanned QR code string
 * @param {string} adminUserId - Admin user ID performing check-in (must match authenticated user)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function checkInUserAction(eventId, userId, qrCode, adminUserId) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // Security: Verify adminUserId matches authenticated user
  if (adminUserId !== currentUserId) {
    return { data: null, error: { message: 'Unauthorized: adminUserId must match authenticated user' } }
  }
  return await checkInUser(eventId, userId, qrCode, adminUserId)
}

/**
 * Check a user out of an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to check out
 * @param {string} adminUserId - Admin user ID performing check-out (must match authenticated user)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function checkOutUserAction(eventId, userId, adminUserId) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // Security: Verify adminUserId matches authenticated user
  if (adminUserId !== currentUserId) {
    return { data: null, error: { message: 'Unauthorized: adminUserId must match authenticated user' } }
  }
  return await checkOutUser(eventId, userId, adminUserId)
}

/**
 * Get all users currently checked into an event
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID (must match authenticated user)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getCheckedInUsersAction(eventId, adminUserId) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // Security: Verify adminUserId matches authenticated user
  if (adminUserId !== currentUserId) {
    return { data: null, error: { message: 'Unauthorized: adminUserId must match authenticated user' } }
  }
  return await getCheckedInUsers(eventId, adminUserId)
}

/**
 * Check if a user is currently checked into an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<{data: boolean, error: object|null}>}
 */
export async function isUserCheckedInAction(eventId, userId = null) {
  const currentUserId = userId || await getCurrentUserId()
  if (!currentUserId) {
    return { data: false, error: { message: 'Not authenticated' } }
  }
  return await isUserCheckedIn(eventId, currentUserId)
}

// ============================================
// Geolocation Tracking Actions
// ============================================

/**
 * Track user's current location for geolocation tracking
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID (must match authenticated user)
 * @param {number} latitude - User's current latitude
 * @param {number} longitude - User's current longitude
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function trackUserLocationAction(eventId, userId, latitude, longitude) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // Security: Users can only track their own location
  if (userId !== currentUserId) {
    return { data: null, error: { message: 'Unauthorized: Can only track your own location' } }
  }
  return await trackUserLocation(userId, eventId, latitude, longitude)
}

/**
 * Check if user is within event radius
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID (must match authenticated user)
 * @param {number} latitude - User's current latitude
 * @param {number} longitude - User's current longitude
 * @param {number} radius - Radius in meters (optional, default: 150)
 * @returns {Promise<{data: {inRadius: boolean, distance: number}|null, error: object|null}>}
 */
export async function checkUserInRadiusAction(eventId, userId, latitude, longitude, radius = 150) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // Security: Users can only check their own radius
  if (userId !== currentUserId) {
    return { data: null, error: { message: 'Unauthorized: Can only check your own radius' } }
  }
  return await checkUserInRadius(eventId, userId, latitude, longitude, radius)
}

/**
 * Automatically check out user when they leave event location
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID (must match authenticated user)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function autoCheckOutAction(eventId, userId) {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  // Security: Users can only check themselves out
  if (userId !== currentUserId) {
    return { data: null, error: { message: 'Unauthorized: Can only check yourself out' } }
  }
  return await autoCheckOut(userId, eventId)
}

