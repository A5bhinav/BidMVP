// lib/utils/errors.js
// Shared error serialization utility
// Converts Supabase errors and other error objects to plain serializable objects
// that can be safely passed from Server Components/Actions to Client Components

/**
 * Serialize an error to a plain object safe for client transfer
 * @param {object|Error|null} error - Error to serialize
 * @param {string} defaultMessage - Default message if error is null/empty
 * @returns {{ message: string, code: string|null, statusCode: number|null, details: string|null, hint: string|null }}
 */
export function serializeError(error, defaultMessage = 'An unexpected error occurred') {
  if (!error) return { message: defaultMessage }
  return {
    message: error.message || defaultMessage,
    code: error.code || null,
    statusCode: error.statusCode || null,
    details: error.details || null,
    hint: error.hint || null,
  }
}

