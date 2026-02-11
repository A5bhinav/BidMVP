// components/EventFeed.js
// Reusable event feed container component
// Handles rendering of event list, loading states, and empty states

'use client'

import { memo } from 'react'
import EventCard from '@/components/EventCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { EventCardSkeleton } from '@/components/ui/Skeleton'

/**
 * EventFeed Component
 * Reusable container for displaying a list of events
 * 
 * @param {object} props
 * @param {Array} props.events - Array of event objects to display
 * @param {boolean} props.loading - Whether events are currently loading
 * @param {object|null} props.error - Error object with type and message (optional)
 * @param {function} props.onRetry - Callback function for retry button (optional)
 * @param {function} props.onCompleteProfile - Callback function for complete profile button (optional)
 * @param {string} props.emptyMessage - Custom message for empty state (optional)
 * @param {string} props.emptySubMessage - Custom sub-message for empty state (optional)
 * @param {string} props.className - Additional CSS classes (optional)
 */
function EventFeed({
  events = [],
  loading = false,
  error = null,
  onRetry = null,
  onCompleteProfile = null,
  emptyMessage = 'No events found',
  emptySubMessage = 'Check back later for upcoming events at your campus!',
  className = ''
}) {
  // Loading State
  if (loading && !error) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <EventCardSkeleton />
          </Card>
        ))}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <Card className={`mb-4 p-6 text-center bg-red-50 border-red-200 ${className}`}>
        <p className="text-bodySmall text-red-600 mb-4">{error.message}</p>
        {error.type === 'no_school' && onCompleteProfile && (
          <Button
            variant="primary"
            size="medium"
            onClick={onCompleteProfile}
            className="w-full"
          >
            Complete Profile
          </Button>
        )}
        {error.type !== 'no_school' && onRetry && (
          <Button
            variant="primary"
            size="medium"
            onClick={onRetry}
            className="w-full"
          >
            Retry
          </Button>
        )}
      </Card>
    )
  }

  // Empty State
  if (!loading && !error && events.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <p className="text-bodySmall text-gray-medium mb-4">
          {emptyMessage}
        </p>
        <p className="text-bodySmall text-gray-medium">
          {emptySubMessage}
        </p>
      </Card>
    )
  }

  // Events List
  if (!loading && !error && events.length > 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            variant="default"
          />
        ))}
      </div>
    )
  }

  // Fallback (shouldn't reach here)
  return null
}

export default memo(EventFeed)

