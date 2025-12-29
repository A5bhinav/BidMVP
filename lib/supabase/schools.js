// lib/supabase/schools.js
// School/campus management functions
// All functions use server-side Supabase client for database operations

'use server'

import { randomUUID } from 'crypto'
import { createClient } from './server'

/**
 * Get school by email domain
 * @param {string} domain - Email domain (e.g., "stanford.edu")
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getSchoolByDomain(domain) {
  try {
    const supabase = await createClient()

    if (!domain) {
      return { data: null, error: { message: 'Domain is required' } }
    }

    // Normalize domain (lowercase, trim)
    const normalizedDomain = domain.toLowerCase().trim()

    // Query school table by domain (case-insensitive)
    // Start with minimal columns to avoid schema cache errors
    // Add null values for optional columns to maintain expected structure
    const { data: school, error } = await supabase
      .from('school')
      .select('id, name, domain')
      .ilike('domain', normalizedDomain)
      .maybeSingle()

    // Add null values for optional columns if they don't exist
    if (school && !error) {
      school.abbreviation = null
      school.created_at = null
      school.updated_at = null
    }

    if (error) {
      return { data: null, error }
    }

    // Return null data (not error) if school not found
    return { data: school || null, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get school by domain' } }
  }
}

/**
 * Create a new school record
 * @param {object} schoolData - School data
 * @param {string} schoolData.name - Full school name (required)
 * @param {string} schoolData.domain - Email domain (required)
 * @param {string} schoolData.abbreviation - Optional short name
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createSchool(schoolData) {
  try {
    const supabase = await createClient()

    // Validate required fields
    if (!schoolData.name || !schoolData.domain) {
      return {
        data: null,
        error: { message: 'School name and domain are required' }
      }
    }

    // Normalize domain (lowercase, trim)
    const normalizedDomain = schoolData.domain.toLowerCase().trim()

    // Validate domain format (basic validation - must contain at least one dot)
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i
    if (!domainRegex.test(normalizedDomain)) {
      return {
        data: null,
        error: { message: 'Invalid domain format' }
      }
    }

    // Create school record
    // Only insert columns that exist (id, name, domain)
    // Explicitly generate UUID to ensure id is set (database DEFAULT may not work with PostgREST)
    // Don't include abbreviation, created_at, updated_at as they may not exist
    const schoolId = randomUUID()
    
    const { data: school, error } = await supabase
      .from('school')
      .insert({
        id: schoolId,
        name: schoolData.name.trim(),
        domain: normalizedDomain
      })
      .select('id, name, domain')
      .single()

    if (error) {
      // Handle duplicate domain error gracefully
      if (error.code === '23505') { // Unique violation
        // Try to get the existing school
        const { data: existingSchool } = await getSchoolByDomain(normalizedDomain)
        if (existingSchool) {
          return { data: existingSchool, error: null }
        }
      }
      return { data: null, error }
    }

    // Add null values for optional columns to match expected structure
    if (school) {
      school.abbreviation = null
      school.created_at = null
      school.updated_at = null
    }

    return { data: school, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to create school' } }
  }
}

/**
 * Search schools by name or domain (case-insensitive)
 * Supports partial matching for flexible search
 * @param {string} query - Search query (school name or domain)
 * @param {number} limit - Maximum number of results (default: 20, max: 50)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchSchools(query, limit = 20) {
  try {
    const supabase = await createClient()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        data: [],
        error: { message: 'Search query is required' }
      }
    }

    // Normalize limit (between 1 and 50)
    const normalizedLimit = Math.min(Math.max(1, limit), 50)
    
    // Normalize search query (lowercase, trim)
    const searchPattern = `%${query.toLowerCase().trim()}%`

    // Search in name and domain fields (case-insensitive)
    // Use ILIKE for PostgreSQL case-insensitive pattern matching
    // Supabase PostgREST OR syntax: column.operator.value,column2.operator.value2
    // Start with minimal columns to avoid schema cache errors
    const { data: schools, error } = await supabase
      .from('school')
      .select('id, name, domain')
      .or(`name.ilike.${searchPattern},domain.ilike.${searchPattern}`)
      .limit(normalizedLimit)
      .order('name', { ascending: true })

    // Add null values for optional columns to match expected structure
    if (schools && Array.isArray(schools) && !error) {
      schools.forEach(school => {
        school.abbreviation = null
        school.created_at = null
        school.updated_at = null
      })
    }

    if (error) {
      console.error('Error searching schools:', error)
      return { data: null, error }
    }

    return { data: schools || [], error: null }
  } catch (error) {
    console.error('Unexpected error in searchSchools:', error)
    return { data: null, error: { message: error.message || 'Failed to search schools' } }
  }
}

/**
 * Link user to a school (MANUAL SELECTION - takes priority over auto-detection)
 * This function should be used when user manually selects a school.
 * Once linked via this function, autoLinkUser will not overwrite the selection.
 * 
 * @param {string} userId - User ID (from auth.uid())
 * @param {string} schoolId - School ID
 * @returns {Promise<{data: {success: boolean, user: object}|null, error: object|null}>}
 */
export async function linkUserToSchool(userId, schoolId) {
  try {
    const supabase = await createClient()

    if (!userId || !schoolId) {
      return {
        data: null,
        error: { message: 'User ID and School ID are required' }
      }
    }

    // First, verify both user and school exist
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return {
        data: null,
        error: { message: 'User not found' }
      }
    }

    const { data: school, error: schoolError } = await supabase
      .from('school')
      .select('id, name, domain')
      .eq('id', schoolId)
      .maybeSingle()

    if (schoolError || !school) {
      return {
        data: null,
        error: { message: 'School not found' }
      }
    }
    
    // Add null abbreviation if column doesn't exist
    school.abbreviation = null

    // Update user's school_id and school string field (for backward compatibility)
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        school_id: schoolId,
        school: school.name || school.domain // Keep string field updated for backward compatibility
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: updateError }
    }

    return {
      data: {
        success: true,
        user: updatedUser
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to link user to school' } }
  }
}

/**
 * Get school for a user
 * @param {string} userId - User ID (from auth.uid())
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getUserSchool(userId) {
  try {
    const supabase = await createClient()

    if (!userId) {
      return { data: null, error: { message: 'User ID is required' } }
    }

    // Get user's school_id
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle()

    if (userError) {
      return { data: null, error: userError }
    }

    if (!user || !user.school_id) {
      // User has no school linked
      return { data: null, error: null }
    }

    // Get school details
    // Start with minimal columns to avoid schema cache errors
    const { data: school, error: schoolError } = await supabase
      .from('school')
      .select('id, name, domain')
      .eq('id', user.school_id)
      .maybeSingle()

    // Add null values for optional columns to match expected structure
    if (school && !schoolError) {
      school.abbreviation = null
      school.created_at = null
      school.updated_at = null
    }

    if (schoolError) {
      return { data: null, error: schoolError }
    }

    return { data: school || null, error: null }
  } catch (error) {
    return { data: null, error: { message: error.message || 'Failed to get user school' } }
  }
}

