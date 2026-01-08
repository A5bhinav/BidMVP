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

export async function isUserCheckedInAction(eventId, userId = null) {
  const currentUserId = userId || await getCurrentUserId()
  if (!currentUserId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  try {
    const supabase = await createClient()
    
    // Query checkin table directly for user's check-in record (frontend needs full record, not just boolean)
    const { data: checkin, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', currentUserId)
      .eq('is_checked_in', true)
      .maybeSingle()
    
    if (error) {
      return { data: null, error: { message: error.message || 'Failed to check user status' } }
    }
    
    return { data: checkin || null, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check user status' } }
  }
}

// ============================================
// Geolocation Tracking Actions
// ============================================
export async function trackUserLocationAction(eventId, userId, latitude, longitude) {
  return await trackUserLocation(userId, eventId, latitude, longitude)
}

export async function checkUserInRadiusAction(eventId, userId, latitude, longitude) {
  return await checkUserInRadius(eventId, userId, latitude, longitude)
}

export async function autoCheckOutAction(eventId, userId) {
  return await autoCheckOut(userId, eventId)
}
