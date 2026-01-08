// app/actions/guests.js
// Server Actions for guest list and event request management
// These wrap the backend functions and can be called from client components

'use server'

import {
  createEventRequest,
  approveRequest,
  denyRequest,
  getEventRequests,
  manuallyAddGuest,
  getGuestList,
  searchUsers,
  getFraternityEvents,
  getEventsPendingCounts,
} from '@/lib/supabase/guests'
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
// Event Request Actions
// ============================================

/**
 * Create a new event request
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEventRequestAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await createEventRequest(eventId, userId)
}

/**
 * Approve an event request
 * @param {string} requestId - Request ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function approveRequestAction(requestId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await approveRequest(requestId, userId)
}

/**
 * Deny an event request
 * @param {string} requestId - Request ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function denyRequestAction(requestId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await denyRequest(requestId, userId)
}

/**
 * Get event requests
 * @param {string} eventId - Event ID
 * @param {string|null} status - Filter by status: 'pending', 'approved', 'denied', or null for all
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getEventRequestsAction(eventId, status = null) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getEventRequests(eventId, userId, status)
}

/**
 * Manually add a guest to an event
 * @param {string} eventId - Event ID
 * @param {string} userIdToAdd - User ID to add
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function manuallyAddGuestAction(eventId, userIdToAdd) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await manuallyAddGuest(eventId, userIdToAdd, userId)
}

/**
 * Get guest list for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getGuestListAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getGuestList(eventId, userId)
}

/**
 * Search users by name or email
 * @param {string} query - Search query
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchUsersAction(query) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await searchUsers(query, userId)
}

/**
 * Get all events for a fraternity
 * @param {string} fraternityId - Fraternity ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFraternityEventsAction(fraternityId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getFraternityEvents(fraternityId, userId)
}

/**
 * Get pending request counts for multiple events (optimized batch query)
 * @param {Array<string>} eventIds - Array of event IDs
 * @returns {Promise<{data: Map<string, number>|null, error: object|null}>}
 */
export async function getEventsPendingCountsAction(eventIds) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  return await getEventsPendingCounts(eventIds, userId)
}

/**
 * Check if user is approved for an event (has approved request or event is public)
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: {isApproved: boolean, isPublic: boolean}|null, error: object|null}>}
 */
export async function checkUserApprovedForEventAction(eventId) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { data: null, error: { message: 'Not authenticated' } }
  }
  
  try {
    const supabase = await createClient()
    
    // Get event to check visibility
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, visibility')
      .eq('id', eventId)
      .single()
    
    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }
    
    // Public events don't require approval
    if (event.visibility === 'public') {
      return { data: { isApproved: true, isPublic: true }, error: null }
    }
    
    // For invite-only/rush-only events, check for approved request
    const { data: request, error: requestError } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .maybeSingle()
    
    if (requestError) {
      return { data: null, error: { message: requestError.message || 'Failed to check approval status' } }
    }
    
    return { 
      data: { 
        isApproved: !!request, 
        isPublic: false 
      }, 
      error: null 
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check approval status' } }
  }
}

