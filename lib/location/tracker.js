// lib/location/tracker.js
// Geolocation tracking functions for automatic check-out system
// All functions use server-side Supabase client for database operations

'use server'

import { createClient } from '../supabase/server'
import { checkOutUser } from '../supabase/checkin'
import { geocodeAddress } from '../geocoding/nominatim'

// Helper function to serialize Supabase errors to plain objects
function serializeError(error, defaultMessage = 'An unexpected error occurred') {
  if (!error) return { message: defaultMessage }
  return {
    message: error.message || defaultMessage,
    code: error.code || null,
    statusCode: error.statusCode || null,
    details: error.details || null,
    hint: error.hint || null,
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Parse location string to get coordinates
 * Handles both address strings and coordinate strings
 * @param {string} location - Location string (address or "lat,lng")
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function parseLocationToCoordinates(location) {
  if (!location || typeof location !== 'string') {
    return null
  }

  const trimmedLocation = location.trim()
  
  // If empty after trimming, return null
  if (!trimmedLocation) {
    return null
  }

  // Check if it's a coordinate format (lat,lng)
  const latLngPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/
  if (latLngPattern.test(trimmedLocation)) {
    const [lat, lng] = trimmedLocation.split(',').map(Number)
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }

  // Otherwise, treat as address and geocode
  return await geocodeAddress(trimmedLocation)
}

/**
 * Get event location coordinates (with caching)
 * @param {string} eventId - Event ID
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
async function getEventCoordinates(eventId) {
  const supabase = await createClient()

  // Get event with cached coordinates
  const { data: event, error } = await supabase
    .from('event')
    .select('location, location_lat, location_lng')
    .eq('id', eventId)
    .single()

  if (error || !event) {
    return null
  }

  // If cached coordinates exist, use them
  if (event.location_lat !== null && event.location_lng !== null) {
    return {
      lat: parseFloat(event.location_lat),
      lng: parseFloat(event.location_lng)
    }
  }

  // If no cached coordinates, parse location and cache
  if (!event.location) {
    return null
  }

  const coordinates = await parseLocationToCoordinates(event.location)
  
  if (coordinates) {
    // Cache the coordinates in the database
    await supabase
      .from('event')
      .update({
        location_lat: coordinates.lat,
        location_lng: coordinates.lng
      })
      .eq('id', eventId)
  }

  return coordinates
}

/**
 * Store user's current location for geolocation tracking
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @param {number} latitude - User's current latitude
 * @param {number} longitude - User's current longitude
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function trackUserLocation(userId, eventId, latitude, longitude) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!userId || !eventId || latitude === undefined || longitude === undefined) {
      return { data: null, error: { message: 'All parameters are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(eventId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      return { data: null, error: { message: 'Invalid latitude/longitude values' } }
    }

    // Find existing checkin record
    const { data: checkin, error: findError } = await supabase
      .from('checkin')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_checked_in', true)
      .maybeSingle()

    if (findError) {
      return { data: null, error: serializeError(findError) }
    }

    if (!checkin) {
      return { data: null, error: { message: 'User is not checked in' } }
    }

    // Update checkin record with location (store in checkin table)
    const { data: updatedCheckin, error: updateError } = await supabase
      .from('checkin')
      .update({
        last_location_lat: latitude,
        last_location_lng: longitude,
        last_location_at: new Date().toISOString()
      })
      .eq('id', checkin.id)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: serializeError(updateError) }
    }

    return { data: updatedCheckin, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to track user location' } }
  }
}

/**
 * Check if user is within event radius
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {number} latitude - User's current latitude
 * @param {number} longitude - User's current longitude
 * @param {number} radius - Radius in meters (default: 150)
 * @returns {Promise<{data: {inRadius: boolean, distance: number}|null, error: object|null}>}
 */
export async function checkUserInRadius(eventId, userId, latitude, longitude, radius = 150) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!eventId || !userId || latitude === undefined || longitude === undefined) {
      return { data: null, error: { message: 'All parameters are required' } }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(eventId) || !uuidRegex.test(userId)) {
      return { data: null, error: { message: 'Invalid ID format' } }
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      return { data: null, error: { message: 'Invalid latitude/longitude values' } }
    }

    // Validate radius
    if (typeof radius !== 'number' || isNaN(radius) || radius <= 0) {
      radius = 150 // Default to 150 meters
    }

    // Get event location coordinates (with caching)
    const eventCoords = await getEventCoordinates(eventId)
    
    if (!eventCoords) {
      return { data: null, error: { message: 'Event location is required for automatic check-out' } }
    }

    // Calculate distance
    const distance = calculateDistance(
      latitude,
      longitude,
      eventCoords.lat,
      eventCoords.lng
    )

    // Check if within radius
    const inRadius = distance <= radius

    return { data: { inRadius, distance }, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to check user radius' } }
  }
}

/**
 * Automatically check out user when they leave event location
 * Note: This function is called by the frontend after detecting user is outside radius for threshold time
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function autoCheckOut(userId, eventId) {
  try {
    // Get user's last tracked location
    const supabase = await createClient()
    
    const { data: checkin, error: findError } = await supabase
      .from('checkin')
      .select('id, last_location_lat, last_location_lng, is_checked_in')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('is_checked_in', true)
      .maybeSingle()

    if (findError) {
      return { data: null, error: serializeError(findError) }
    }

    if (!checkin) {
      return { data: null, error: { message: 'User is not checked in' } }
    }

    // If we have last location, verify they're still outside radius
    if (checkin.last_location_lat !== null && checkin.last_location_lng !== null) {
      const radiusCheck = await checkUserInRadius(
        eventId,
        userId,
        checkin.last_location_lat,
        checkin.last_location_lng
      )

      if (radiusCheck.error) {
        return { data: null, error: radiusCheck.error }
      }

      // If user is back in radius, don't check out
      if (radiusCheck.data?.inRadius) {
        return { data: null, error: { message: 'User is back in radius' } }
      }
    }

    // Call checkOutUser with null adminUserId (automatic check-out)
    return await checkOutUser(eventId, userId, null)
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to auto check-out user' } }
  }
}

