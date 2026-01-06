// lib/geocoding/nominatim.js
// Geocoding utility using OpenStreetMap Nominatim API
// Converts address strings to latitude/longitude coordinates

// Simple throttle: track last request time
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second

/**
 * Geocode an address string to coordinates using OpenStreetMap Nominatim API
 * @param {string} address - Address string (e.g., "123 Main St, Berkeley, CA")
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export async function geocodeAddress(address) {
  try {
    // Validate input
    if (!address || typeof address !== 'string' || !address.trim()) {
      return null
    }

    // Wait if needed to respect rate limit
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      )
    }
    lastRequestTime = Date.now()

    // URL encode the address
    const encodedAddress = encodeURIComponent(address.trim())

    // Make GET request to Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'BidMVP/1.0 (contact@bidmvp.com)' // Required by Nominatim
      }
    })

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    // Check if we got results
    if (!Array.isArray(data) || data.length === 0) {
      return null
    }

    // Extract lat and lon from first result
    const firstResult = data[0]
    if (!firstResult.lat || !firstResult.lon) {
      return null
    }

    // Parse and return coordinates
    const lat = parseFloat(firstResult.lat)
    const lon = parseFloat(firstResult.lon)

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null
    }

    return { lat, lng: lon }
  } catch (error) {
    console.error('Error geocoding address:', error)
    return null
  }
}

