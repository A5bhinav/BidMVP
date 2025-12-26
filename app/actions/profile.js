// app/actions/profile.js
// Server Actions for profile-related operations
// These can be called from Client Components

'use server'

import { uploadProfilePhoto as uploadPhoto } from '@/lib/storage/upload'
import { checkProfileComplete, createUserProfile, updateUserProfile, getUserProfile } from '@/lib/supabase/users'

/**
 * Upload profile photo (Server Action wrapper)
 * @param {string} userId - User ID
 * @param {FormData} formData - FormData containing the file
 * @returns {Promise<{data: {url: string}|null, error: object|null}>}
 */
export async function uploadProfilePhoto(userId, formData) {
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return { data: null, error: { message: 'No file provided' } }
  }
  return await uploadPhoto(userId, file)
}

/**
 * Check if profile is complete (Server Action wrapper)
 */
export async function checkProfile(userId) {
  return await checkProfileComplete(userId)
}

/**
 * Create user profile (Server Action wrapper)
 */
export async function createProfile(userId, profileData) {
  return await createUserProfile(userId, profileData)
}

/**
 * Update user profile (Server Action wrapper)
 */
export async function updateProfile(userId, profileData) {
  return await updateUserProfile(userId, profileData)
}

/**
 * Get user profile (Server Action wrapper)
 */
export async function getProfile(userId) {
  return await getUserProfile(userId)
}

