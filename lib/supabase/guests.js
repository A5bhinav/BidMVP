// lib/supabase/guests.js
// Guest list and event request management functions
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from './server'
import { checkIsAdmin } from './groupMembers'
import { serializeError } from '../utils/errors'

/**
 * Shared helper: Validate that a user is admin for a specific event's fraternity
 * Reduces repeated 2-query pattern across all guest/checkin functions
 * @param {object} supabase - Supabase client instance (reuses existing client)
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID to validate
 * @param {string} actionDescription - Human-readable action for error messages
 * @returns {Promise<{event: object|null, error: object|null}>}
 */
async function validateAdminForEvent(supabase, eventId, adminUserId, actionDescription = 'perform this action') {
  const { data: event, error: eventError } = await supabase
    .from('event')
    .select('id, frat_id, visibility')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return { event: null, error: { message: 'Event not found' } }
  }

  const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, event.frat_id)
  if (adminError || !adminCheck?.isAdmin) {
    return { event: null, error: { message: `Only admins can ${actionDescription}` } }
  }

  return { event, error: null }
}

/**
 * Create a new event request for a user
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID requesting access
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createEventRequest(eventId, userId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId) {
      return { data: null, error: { message: 'Event ID and User ID are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // Check if event exists and get visibility and fraternity ID
    const { data: event, error: eventError } = await supabase
      .from('event')
      .select('id, visibility, frat_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { data: null, error: { message: 'Event not found' } }
    }

    // Check if user is an admin of the fraternity that owns this event
    // Admins cannot add themselves to the guest list
    const { data: adminCheck, error: adminError } = await checkIsAdmin(userId, event.frat_id)
    if (!adminError && adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Admins cannot add themselves to the guest list' } }
    }

    // Can't request public events - only invite-only or rush-only
    if (event.visibility === 'public') {
      return { data: null, error: { message: 'Public events do not require requests' } }
    }

    // Check if user already has a request for this event
    const { data: existingRequest } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRequest) {
      return { data: null, error: { message: 'Request already exists for this event' } }
    }

    // Create the request
    const { data: request, error: insertError } = await supabase
      .from('event_requests')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: request, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create event request' } }
  }
}

/**
 * Approve a pending event request
 * @param {string} requestId - Request ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function approveRequest(requestId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!requestId || !adminUserId) {
      return { data: null, error: { message: 'Request ID and Admin User ID are required' } }
    }

    // Get the request to check status and event_id
    const { data: request, error: requestError } = await supabase
      .from('event_requests')
      .select('event_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { data: null, error: { message: 'Request not found' } }
    }

    if (request.status !== 'pending') {
      return { data: null, error: { message: 'Request has already been processed' } }
    }

    // Validate admin using shared helper
    const { error: adminError } = await validateAdminForEvent(supabase, request.event_id, adminUserId, 'approve requests')
    if (adminError) return { data: null, error: adminError }

    // Update request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('event_requests')
      .update({
        status: 'approved',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError) }
    }

    return { data: updatedRequest, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to approve request' } }
  }
}

/**
 * Deny a pending event request
 * @param {string} requestId - Request ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function denyRequest(requestId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!requestId || !adminUserId) {
      return { data: null, error: { message: 'Request ID and Admin User ID are required' } }
    }

    // Get the request to check status and event_id
    const { data: request, error: requestError } = await supabase
      .from('event_requests')
      .select('event_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return { data: null, error: { message: 'Request not found' } }
    }

    if (request.status !== 'pending') {
      return { data: null, error: { message: 'Request has already been processed' } }
    }

    // Validate admin using shared helper
    const { error: adminError } = await validateAdminForEvent(supabase, request.event_id, adminUserId, 'deny requests')
    if (adminError) return { data: null, error: adminError }

    // Update request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('event_requests')
      .update({
        status: 'denied',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError) }
    }

    return { data: updatedRequest, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to deny request' } }
  }
}

/**
 * Get all requests for an event (filtered by status if provided)
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @param {string|null} status - Filter by status: 'pending', 'approved', 'denied', or null for all
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getEventRequests(eventId, adminUserId, status = null) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !adminUserId) {
      return { data: null, error: { message: 'Event ID and Admin User ID are required' } }
    }

    // Validate admin using shared helper
    const { error: adminValidationError } = await validateAdminForEvent(supabase, eventId, adminUserId, 'view event requests')
    if (adminValidationError) return { data: null, error: adminValidationError }

    // Build query - join with User table
    let query = supabase
      .from('event_requests')
      .select(`
        id,
        event_id,
        user_id,
        status,
        requested_at,
        responded_at,
        user:User!event_requests_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          safety_score
        )
      `)
      .eq('event_id', eventId)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Order by requested_at descending (newest first)
    query = query.order('requested_at', { ascending: false })

    const { data: requests, error: requestsError } = await query

    if (requestsError) {
      return { data: null, error: serializeError(requestsError) }
    }

    // Get safety tiers for all users in the requests
    if (requests && requests.length > 0) {
      const userIds = requests.map((r) => r.user_id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: safetyTiers, error: tiersError } = await supabase
          .from('safetytier')
          .select('user_id, tier')
          .in('user_id', userIds)

        if (!tiersError && safetyTiers) {
          // Create a map of user_id to safety tier
          const tierMap = new Map(safetyTiers.map((st) => [st.user_id, st.tier]))

          // Add safety tier to each request (with score from User table)
          requests.forEach((request) => {
            const tier = tierMap.get(request.user_id)
            const score = request.user?.safety_score || null
            request.safety_tier = tier ? { tier, score } : null
          })
        } else {
          // If no safety tiers found, still try to include score from user
          requests.forEach((request) => {
            const score = request.user?.safety_score || null
            request.safety_tier = score !== null ? { tier: null, score } : null
          })
        }
      }
    }

    return { data: requests || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get event requests' } }
  }
}

/**
 * Manually add a user to guest list (creates approved request)
 * @param {string} eventId - Event ID
 * @param {string} userIdToAdd - User ID to add
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function manuallyAddGuest(eventId, userIdToAdd, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userIdToAdd || !adminUserId) {
      return { data: null, error: { message: 'Event ID, User ID to add, and Admin User ID are required' } }
    }

    // Validate admin using shared helper
    const { event, error: adminValidationError } = await validateAdminForEvent(supabase, eventId, adminUserId, 'manually add guests')
    if (adminValidationError) return { data: null, error: adminValidationError }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userIdToAdd)
      .maybeSingle()

    if (userError || !user) {
      return { data: null, error: { message: 'User not found' } }
    }

    // Check if target user is an admin of the fraternity that owns this event
    // Admins cannot be added to the guest list (even manually)
    const { data: targetAdminCheck, error: targetAdminError } = await checkIsAdmin(userIdToAdd, event.frat_id)
    if (!targetAdminError && targetAdminCheck?.isAdmin) {
      return { data: null, error: { message: 'Admins cannot be added to the guest list' } }
    }

    // Check if user is already on guest list
    const { data: existingRequest } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userIdToAdd)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        return { data: null, error: { message: 'User is already on the guest list' } }
      }
      // If pending or denied, update to approved
      const { data: updatedRequest, error: updateError } = await supabase
        .from('event_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
        })
        .eq('id', existingRequest.id)
        .select()
        .single()

      if (updateError) {
        return { data: null, error: serializeError(updateError) }
      }

      return { data: updatedRequest, error: null }
    }

    // Create approved request
    const { data: request, error: insertError } = await supabase
      .from('event_requests')
      .insert({
        event_id: eventId,
        user_id: userIdToAdd,
        status: 'approved',
        requested_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return { data: null, error: serializeError(insertError) }
    }

    return { data: request, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to manually add guest' } }
  }
}

/**
 * Get all approved guests for an event
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getGuestList(eventId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !adminUserId) {
      return { data: null, error: { message: 'Event ID and Admin User ID are required' } }
    }

    // Validate admin using shared helper
    const { error: adminValidationError } = await validateAdminForEvent(supabase, eventId, adminUserId, 'view guest list')
    if (adminValidationError) return { data: null, error: adminValidationError }

    // Get approved requests with user info
    const { data: guests, error: guestsError } = await supabase
      .from('event_requests')
      .select(`
        id,
        event_id,
        user_id,
        status,
        requested_at,
        responded_at,
        user:User!event_requests_user_id_fkey (
          id,
          name,
          email,
          profile_pic,
          year,
          safety_score
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('requested_at', { ascending: true })

    if (guestsError) {
      return { data: null, error: serializeError(guestsError) }
    }

    // Get safety tiers for all guests
    if (guests && guests.length > 0) {
      const userIds = guests.map((g) => g.user_id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: safetyTiers, error: tiersError } = await supabase
          .from('safetytier')
          .select('user_id, tier')
          .in('user_id', userIds)

        if (!tiersError && safetyTiers) {
          // Create a map of user_id to safety tier
          const tierMap = new Map(safetyTiers.map((st) => [st.user_id, st.tier]))

          // Add safety tier to each guest (with score from User table)
          guests.forEach((guest) => {
            const tier = tierMap.get(guest.user_id)
            const score = guest.user?.safety_score || null
            guest.safety_tier = tier ? { tier, score } : null
          })
        } else {
          // If no safety tiers found, still try to include score from user
          guests.forEach((guest) => {
            const score = guest.user?.safety_score || null
            guest.safety_tier = score !== null ? { tier: null, score } : null
          })
        }
      }
    }

    return { data: guests || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get guest list' } }
  }
}

/**
 * Search users by name or email for manual guest addition
 * @param {string} query - Search query (name or email)
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchUsers(query, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!query || !adminUserId) {
      return { data: null, error: { message: 'Query and Admin User ID are required' } }
    }

    // Validate admin is admin (any fraternity admin can search users)
    // Check if user is admin of any fraternity
    const { data: adminCheck } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .limit(1)

    // Also check if user is creator of any fraternity
    const { data: creatorCheck } = await supabase
      .from('fraternity')
      .select('id')
      .eq('creator_id', adminUserId)
      .limit(1)

    if ((!adminCheck || adminCheck.length === 0) && (!creatorCheck || creatorCheck.length === 0)) {
      return { data: null, error: { message: 'Only admins can search users' } }
    }

    // Search users by name or email
    const searchPattern = `%${query.trim()}%`
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email, profile_pic, year')
      .or(`name.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .limit(20)
      .order('name', { ascending: true })

    if (usersError) {
      return { data: null, error: serializeError(usersError) }
    }

    return { data: users || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to search users' } }
  }
}

/**
 * Get all events for a fraternity
 * @param {string} fraternityId - Fraternity ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getFraternityEvents(fraternityId, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!fraternityId || !adminUserId) {
      return { data: null, error: { message: 'Fraternity ID and Admin User ID are required' } }
    }

    // Validate admin is admin of the fraternity
    const { data: adminCheck, error: adminError } = await checkIsAdmin(adminUserId, fraternityId)
    if (adminError || !adminCheck?.isAdmin) {
      return { data: null, error: { message: 'Only admins can view fraternity events' } }
    }

    // Get all events for the fraternity
    const { data: events, error: eventsError } = await supabase
      .from('event')
      .select('id, title, date, end_time, event_type, visibility, bid_price, location, description, image_url, line_skip_price, created_at, updated_at')
      .eq('frat_id', fraternityId)
      .order('date', { ascending: false })

    if (eventsError) {
      return { data: null, error: serializeError(eventsError) }
    }

    return { data: events || [], error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get fraternity events' } }
  }
}

/**
 * Get pending request counts for multiple events at once (optimized)
 * @param {Array<string>} eventIds - Array of event IDs
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Map<string, number>|null, error: object|null}>}
 */
export async function getEventsPendingCounts(eventIds, adminUserId) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return { data: new Map(), error: null }
    }

    if (!adminUserId) {
      return { data: null, error: { message: 'Admin User ID is required' } }
    }

    // Get all events to verify admin access (batch check)
    const { data: events, error: eventsError } = await supabase
      .from('event')
      .select('id, frat_id')
      .in('id', eventIds)

    if (eventsError || !events || events.length === 0) {
      return { data: new Map(), error: null }
    }

    // Batch verify admin has access to all events' fraternities
    // Uses 2 queries instead of N×2 sequential queries
    const fratIds = [...new Set(events.map(e => e.frat_id))]

    const { data: adminMemberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .in('group_id', fratIds)

    const { data: creatorFrats } = await supabase
      .from('fraternity')
      .select('id')
      .eq('creator_id', adminUserId)
      .in('id', fratIds)

    const adminFratIds = new Set([
      ...(adminMemberships || []).map(m => m.group_id),
      ...(creatorFrats || []).map(f => f.id)
    ])

    if (fratIds.some(id => !adminFratIds.has(id))) {
      return { data: null, error: { message: 'Only admins can view event request counts' } }
    }

    // Get pending request counts for all events in a single query
    const { data: pendingRequests, error: countsError } = await supabase
      .from('event_requests')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'pending')

    if (countsError) {
      return { data: null, error: serializeError(countsError) }
    }

    // Count requests per event
    const countsMap = new Map()
    eventIds.forEach(eventId => {
      countsMap.set(eventId, 0)
    })

    if (pendingRequests) {
      pendingRequests.forEach(request => {
        const currentCount = countsMap.get(request.event_id) || 0
        countsMap.set(request.event_id, currentCount + 1)
      })
    }

    return { data: countsMap, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get pending counts' } }
  }
}

