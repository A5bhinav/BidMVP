// lib/mocks/checkinData.js
// Mock data and functions for frontend development
// These match the real function signatures and can be used for testing

// Mock user data
const mockUsers = [
  {
    id: 'mock-user-1',
    name: 'John Doe',
    email: 'john.doe@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 2,
    gender: 'M'
  },
  {
    id: 'mock-user-2',
    name: 'Jane Smith',
    email: 'jane.smith@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 3,
    gender: 'F'
  },
  {
    id: 'mock-user-3',
    name: 'Bob Johnson',
    email: 'bob.johnson@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 1,
    gender: 'M'
  },
  {
    id: 'mock-user-4',
    name: 'Alice Williams',
    email: 'alice.williams@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 4,
    gender: 'F'
  },
  {
    id: 'mock-user-5',
    name: 'Charlie Brown',
    email: 'charlie.brown@berkeley.edu',
    profile_pic: 'https://via.placeholder.com/150',
    year: 2,
    gender: 'M'
  }
]

// Mock check-in records
const mockCheckIns = [
  {
    id: 'mock-checkin-1',
    event_id: 'mock-event-1',
    user_id: 'mock-user-1',
    checked_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    checked_out_at: null,
    is_checked_in: true,
    entry_method: 'qr_scan',
    user: mockUsers[0]
  },
  {
    id: 'mock-checkin-2',
    event_id: 'mock-event-1',
    user_id: 'mock-user-2',
    checked_in_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min ago
    checked_out_at: null,
    is_checked_in: true,
    entry_method: 'qr_scan',
    user: mockUsers[1]
  },
  {
    id: 'mock-checkin-3',
    event_id: 'mock-event-1',
    user_id: 'mock-user-3',
    checked_in_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
    checked_out_at: null,
    is_checked_in: true,
    entry_method: 'qr_scan',
    user: mockUsers[2]
  }
]

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock check-in user function
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to check in
 * @param {string} qrCode - Scanned QR code string
 * @param {string} adminUserId - Admin user ID performing check-in
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function mockCheckInUser(eventId, userId, qrCode, adminUserId) {
  await delay(300 + Math.random() * 200) // 300-500ms delay

  // Basic QR code format validation
  if (!qrCode || !qrCode.startsWith('user-')) {
    return { data: null, error: { message: 'Invalid QR code format' } }
  }

  // Check if user already checked in
  const existing = mockCheckIns.find(
    ci => ci.event_id === eventId && ci.user_id === userId && ci.is_checked_in
  )
  if (existing) {
    return { data: null, error: { message: 'User is already checked in' } }
  }

  // Create mock check-in record
  const mockUser = mockUsers.find(u => u.id === userId) || mockUsers[0]
  const mockCheckIn = {
    id: `mock-checkin-${Date.now()}`,
    event_id: eventId,
    user_id: userId,
    checked_in_at: new Date().toISOString(),
    checked_out_at: null,
    is_checked_in: true,
    entry_method: 'qr_scan',
    user: mockUser
  }

  mockCheckIns.push(mockCheckIn)

  return { data: mockCheckIn, error: null }
}

/**
 * Mock check-out user function
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to check out
 * @param {string|null} adminUserId - Admin user ID (optional for automatic check-out)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function mockCheckOutUser(eventId, userId, adminUserId) {
  await delay(300 + Math.random() * 200) // 300-500ms delay

  const checkIn = mockCheckIns.find(
    ci => ci.event_id === eventId && ci.user_id === userId && ci.is_checked_in
  )

  if (!checkIn) {
    return { data: null, error: { message: 'User is not checked in' } }
  }

  // Update check-in record
  checkIn.is_checked_in = false
  checkIn.checked_out_at = new Date().toISOString()

  return { data: checkIn, error: null }
}

/**
 * Mock get checked-in users function
 * @param {string} eventId - Event ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function mockGetCheckedInUsers(eventId, adminUserId) {
  await delay(300 + Math.random() * 200) // 300-500ms delay

  const checkedIn = mockCheckIns.filter(
    ci => ci.event_id === eventId && ci.is_checked_in
  )

  // Sort by checked_in_at descending
  checkedIn.sort((a, b) => 
    new Date(b.checked_in_at) - new Date(a.checked_in_at)
  )

  return { data: checkedIn, error: null }
}

/**
 * Mock is user checked in function
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: boolean, error: object|null}>}
 */
export async function mockIsUserCheckedIn(eventId, userId) {
  await delay(200 + Math.random() * 100) // 200-300ms delay

  const checkIn = mockCheckIns.find(
    ci => ci.event_id === eventId && ci.user_id === userId && ci.is_checked_in
  )

  return { data: !!checkIn, error: null }
}

/**
 * Mock validate user QR code function
 * @param {string} qrCode - QR code string to validate
 * @param {string} eventId - Expected event ID
 * @param {string} userId - Expected user ID
 * @returns {{valid: boolean, error: string | null}}
 */
export function mockValidateUserQRCode(qrCode, eventId, userId) {
  if (!qrCode || !eventId || !userId) {
    return { valid: false, error: 'QR code, event ID, and user ID are required' }
  }

  const expectedFormat = `user-${userId}-${eventId}`
  
  if (qrCode !== expectedFormat) {
    const match = qrCode.match(/^user-(.+?)-(.+)$/)
    if (!match) {
      return { valid: false, error: 'Invalid QR code format. Expected: user-{userId}-{eventId}' }
    }
    
    const [, extractedUserId, extractedEventId] = match
    if (extractedUserId !== userId) {
      return { valid: false, error: 'QR code does not match user' }
    }
    if (extractedEventId !== eventId) {
      return { valid: false, error: 'QR code does not match event' }
    }
    
    return { valid: false, error: 'QR code validation failed' }
  }

  return { valid: true, error: null }
}

