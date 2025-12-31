// lib/mocks/fraternityData.js
// Mock data and functions for fraternity system
// Used for parallel frontend development before backend is complete

// Sample fraternity data
const mockFraternities = [
  {
    id: 'mock-frat-1',
    name: 'Alpha Phi Alpha',
    type: 'fraternity',
    photo_url: null,
    verified: true,
    email_verified: false,
    member_verified: true,
    member_count: 15,
    quality_member_count: 12,
    flagged_for_review: false,
    verification_email: null,
    verification_requested_at: null
  },
  {
    id: 'mock-frat-2',
    name: 'Delta Delta Delta',
    type: 'sorority',
    photo_url: null,
    verified: false,
    email_verified: true,
    member_verified: true,
    member_count: 8,
    quality_member_count: 7,
    flagged_for_review: false,
    verification_email: 'president@deltadeltadelta.org',
    verification_requested_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'mock-frat-3',
    name: 'Sigma Chi',
    type: 'fraternity',
    photo_url: null,
    verified: false,
    email_verified: false,
    member_verified: false,
    member_count: 5,
    quality_member_count: 4,
    flagged_for_review: false,
    verification_email: null,
    verification_requested_at: null
  }
]

// Sample member data
const mockMembers = {
  'mock-frat-1': [
    { id: 'member-1', user_id: 'user-1', role: 'admin', joined_at: '2024-01-01T00:00:00Z' },
    { id: 'member-2', user_id: 'user-2', role: 'member', joined_at: '2024-01-02T00:00:00Z' },
    { id: 'member-3', user_id: 'user-3', role: 'member', joined_at: '2024-01-03T00:00:00Z' }
  ],
  'mock-frat-2': [
    { id: 'member-4', user_id: 'user-4', role: 'admin', joined_at: '2024-01-01T00:00:00Z' },
    { id: 'member-5', user_id: 'user-5', role: 'member', joined_at: '2024-01-02T00:00:00Z' }
  ],
  'mock-frat-3': [
    { id: 'member-6', user_id: 'user-6', role: 'admin', joined_at: '2024-01-01T00:00:00Z' }
  ]
}

// Mock user profiles
const mockUserProfiles = {
  'user-1': { id: 'user-1', name: 'John Doe', profile_pic: null, year: 3, email: 'john@example.edu' },
  'user-2': { id: 'user-2', name: 'Jane Smith', profile_pic: null, year: 2, email: 'jane@example.edu' },
  'user-3': { id: 'user-3', name: 'Bob Johnson', profile_pic: null, year: 4, email: 'bob@example.edu' },
  'user-4': { id: 'user-4', name: 'Alice Williams', profile_pic: null, year: 2, email: 'alice@example.edu' },
  'user-5': { id: 'user-5', name: 'Charlie Brown', profile_pic: null, year: 3, email: 'charlie@example.edu' },
  'user-6': { id: 'user-6', name: 'Diana Prince', profile_pic: null, year: 1, email: 'diana@example.edu' }
}

/**
 * Mock create fraternity
 */
export async function mockCreateFraternity(fraternityData, creatorUserId) {
  await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay

  const newFraternity = {
    id: `mock-frat-${Date.now()}`,
    name: fraternityData.name,
    type: fraternityData.type,
    photo_url: fraternityData.photo_url || null,
    verified: false,
    email_verified: false,
    member_verified: false,
    member_count: 1,
    quality_member_count: 1,
    flagged_for_review: false,
    verification_email: fraternityData.verification_email || null,
    verification_requested_at: null
  }

  mockFraternities.push(newFraternity)
  mockMembers[newFraternity.id] = [
    { id: `member-${Date.now()}`, user_id: creatorUserId, role: 'admin', joined_at: new Date().toISOString() }
  ]

  return { data: newFraternity, error: null }
}

/**
 * Mock get fraternity
 */
export async function mockGetFraternity(fraternityId) {
  await new Promise(resolve => setTimeout(resolve, 300))

  const fraternity = mockFraternities.find(f => f.id === fraternityId)
  return { data: fraternity || null, error: null }
}

/**
 * Mock update fraternity
 */
export async function mockUpdateFraternity(fraternityId, updates, userId) {
  await new Promise(resolve => setTimeout(resolve, 400))

  const index = mockFraternities.findIndex(f => f.id === fraternityId)
  if (index === -1) {
    return { data: null, error: { message: 'Fraternity not found' } }
  }

  // Check if user is admin (mock check)
  const members = mockMembers[fraternityId] || []
  const isAdmin = members.some(m => m.user_id === userId && m.role === 'admin')
  if (!isAdmin) {
    return { data: null, error: { message: 'Only admins can update fraternity' } }
  }

  mockFraternities[index] = { ...mockFraternities[index], ...updates }
  return { data: mockFraternities[index], error: null }
}

/**
 * Mock get user fraternities
 */
export async function mockGetUserFraternities(userId) {
  await new Promise(resolve => setTimeout(resolve, 300))

  const fraternities = []
  for (const [fratId, members] of Object.entries(mockMembers)) {
    const membership = members.find(m => m.user_id === userId)
    if (membership) {
      const fraternity = mockFraternities.find(f => f.id === fratId)
      if (fraternity) {
        fraternities.push({
          fraternity,
          role: membership.role
        })
      }
    }
  }

  return { data: fraternities, error: null }
}

/**
 * Mock search fraternities
 */
export async function mockSearchFraternities(query, schoolId, limit = 20) {
  await new Promise(resolve => setTimeout(resolve, 400))

  const results = mockFraternities
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .filter(f => f.verified || f.member_verified) // Only verified or member-verified
    .slice(0, limit)

  return { data: results, error: null }
}

/**
 * Mock add member
 */
export async function mockAddMember(groupId, userId, role = 'member', addedByUserId) {
  await new Promise(resolve => setTimeout(resolve, 400))

  // Check if user is already a member
  const existingMembers = mockMembers[groupId] || []
  if (existingMembers.some(m => m.user_id === userId)) {
    return { data: null, error: { message: 'User is already a member' } }
  }

  // Check if addedByUserId is admin
  const isAdmin = existingMembers.some(m => m.user_id === addedByUserId && m.role === 'admin')
  if (!isAdmin) {
    return { data: null, error: { message: 'Only admins can add members' } }
  }

  const newMember = {
    id: `member-${Date.now()}`,
    user_id: userId,
    role,
    joined_at: new Date().toISOString()
  }

  if (!mockMembers[groupId]) {
    mockMembers[groupId] = []
  }
  mockMembers[groupId].push(newMember)

  // Update member count
  const fraternity = mockFraternities.find(f => f.id === groupId)
  if (fraternity) {
    fraternity.member_count = mockMembers[groupId].length
    fraternity.quality_member_count = mockMembers[groupId].length // Simplified for mock
    if (fraternity.quality_member_count >= 7) {
      fraternity.member_verified = true
    }
    if (fraternity.quality_member_count >= 10) {
      fraternity.verified = true
    }
  }

  return {
    data: {
      success: true,
      member: newMember,
      verificationUpdated: fraternity?.member_verified || false,
      qualityMemberCount: fraternity?.quality_member_count || 0
    },
    error: null
  }
}

/**
 * Mock remove member
 */
export async function mockRemoveMember(groupId, userId, removedByUserId) {
  await new Promise(resolve => setTimeout(resolve, 400))

  const members = mockMembers[groupId] || []
  const isAdmin = members.some(m => m.user_id === removedByUserId && m.role === 'admin')
  const isSelf = userId === removedByUserId

  if (!isAdmin && !isSelf) {
    return { data: null, error: { message: 'Only admins can remove other members' } }
  }

  mockMembers[groupId] = members.filter(m => m.user_id !== userId)

  // Update member count
  const fraternity = mockFraternities.find(f => f.id === groupId)
  if (fraternity) {
    fraternity.member_count = mockMembers[groupId].length
    fraternity.quality_member_count = mockMembers[groupId].length
  }

  return { data: { success: true }, error: null }
}

/**
 * Mock update member role
 */
export async function mockUpdateMemberRole(groupId, userId, newRole, updatedByUserId) {
  await new Promise(resolve => setTimeout(resolve, 400))

  const members = mockMembers[groupId] || []
  const isAdmin = members.some(m => m.user_id === updatedByUserId && m.role === 'admin')
  if (!isAdmin) {
    return { data: null, error: { message: 'Only admins can update roles' } }
  }

  // Check if removing last admin
  if (newRole !== 'admin') {
    const admins = members.filter(m => m.role === 'admin')
    if (admins.length === 1 && admins[0].user_id === userId) {
      return { data: null, error: { message: 'Cannot remove last admin. Promote another member first.' } }
    }
  }

  const memberIndex = members.findIndex(m => m.user_id === userId)
  if (memberIndex === -1) {
    return { data: null, error: { message: 'Member not found' } }
  }

  members[memberIndex].role = newRole
  return { data: { success: true, member: members[memberIndex] }, error: null }
}

/**
 * Mock get members
 */
export async function mockGetMembers(groupId, userId) {
  await new Promise(resolve => setTimeout(resolve, 300))

  const members = mockMembers[groupId] || []
  const isMember = members.some(m => m.user_id === userId)
  if (!isMember) {
    return { data: null, error: { message: 'Only group members can view members list' } }
  }

  const membersWithProfiles = members.map(m => ({
    ...m,
    user: mockUserProfiles[m.user_id] || { id: m.user_id, name: 'Unknown User', profile_pic: null, year: null, email: null }
  }))

  return { data: membersWithProfiles, error: null }
}

/**
 * Mock check is admin
 */
export async function mockCheckIsAdmin(userId, groupId) {
  await new Promise(resolve => setTimeout(resolve, 200))

  const members = mockMembers[groupId] || []
  const isAdmin = members.some(m => m.user_id === userId && m.role === 'admin')
  return { data: { isAdmin }, error: null }
}

/**
 * Mock get member role
 */
export async function mockGetMemberRole(userId, groupId) {
  await new Promise(resolve => setTimeout(resolve, 200))

  const members = mockMembers[groupId] || []
  const membership = members.find(m => m.user_id === userId)
  return { data: { role: membership?.role || null }, error: null }
}

/**
 * Mock can create events
 */
export async function mockCanCreateEvents(fraternityId) {
  await new Promise(resolve => setTimeout(resolve, 300))

  const fraternity = mockFraternities.find(f => f.id === fraternityId)
  if (!fraternity) {
    return {
      data: {
        canCreate: false,
        reason: 'Fraternity not found',
        membersNeeded: 7,
        qualityMemberCount: 0
      },
      error: null
    }
  }

  const canCreate = fraternity.quality_member_count >= 7 || 
                    (fraternity.email_verified && fraternity.quality_member_count >= 5) ||
                    fraternity.verified

  if (canCreate) {
    return {
      data: {
        canCreate: true,
        reason: null,
        membersNeeded: 0,
        qualityMemberCount: fraternity.quality_member_count
      },
      error: null
    }
  }

  const membersNeeded = Math.max(0, 7 - fraternity.quality_member_count)
  return {
    data: {
      canCreate: false,
      reason: `Add ${membersNeeded} more verified members to unlock events`,
      membersNeeded,
      qualityMemberCount: fraternity.quality_member_count
    },
    error: null
  }
}

/**
 * Mock check verification status
 */
export async function mockCheckVerificationStatus(fraternityId) {
  await new Promise(resolve => setTimeout(resolve, 300))

  const fraternity = mockFraternities.find(f => f.id === fraternityId)
  if (!fraternity) {
    return { data: null, error: { message: 'Fraternity not found' } }
  }

  let membersNeeded = 0
  let requirements = ''

  if (fraternity.quality_member_count >= 7) {
    requirements = 'Ready to create events! ✓'
  } else {
    membersNeeded = 7 - fraternity.quality_member_count
    if (fraternity.email_verified && fraternity.verification_email) {
      requirements = `Email verified ✓ | Add ${membersNeeded} more verified members (or 5+ with email)`
    } else {
      requirements = `Add ${membersNeeded} more verified members to unlock events`
    }
  }

  return {
    data: {
      email_verified: fraternity.email_verified,
      member_verified: fraternity.member_verified,
      verified: fraternity.verified,
      member_count: fraternity.member_count,
      quality_member_count: fraternity.quality_member_count,
      membersNeeded,
      requirements
    },
    error: null
  }
}

/**
 * Mock verify fraternity email
 */
export async function mockVerifyFraternityEmail(fraternityId, verificationToken) {
  await new Promise(resolve => setTimeout(resolve, 400))

  const fraternity = mockFraternities.find(f => f.id === fraternityId)
  if (!fraternity) {
    return { data: { verified: false, status: null }, error: { message: 'Fraternity not found' } }
  }

  fraternity.email_verified = true

  return {
    data: {
      verified: true,
      status: {
        email_verified: true,
        member_verified: fraternity.member_verified,
        verified: fraternity.verified,
        quality_member_count: fraternity.quality_member_count
      }
    },
    error: null
  }
}

/**
 * Mock report fraternity
 */
export async function mockReportFraternity(fraternityId, reporterUserId, reason, description) {
  await new Promise(resolve => setTimeout(resolve, 400))

  const fraternity = mockFraternities.find(f => f.id === fraternityId)
  if (!fraternity) {
    return { data: null, error: { message: 'Fraternity not found' } }
  }

  const reportId = `report-${Date.now()}`
  return {
    data: {
      reportId,
      success: true
    },
    error: null
  }
}
