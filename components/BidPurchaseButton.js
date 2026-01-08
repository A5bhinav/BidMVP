// components/BidPurchaseButton.js
// Reusable button/card component for purchasing bids with Stripe Checkout integration

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createStripeCheckoutSessionAction } from '@/app/actions/revenue'
// Note: getEventRevenueAction requires admin access, so purchase status check may not work for regular users
import { getEventRevenueAction } from '@/app/actions/revenue'

export default function BidPurchaseButton({
  eventId,
  event,
  onSuccess,
  onError,
  disabled = false,
  variant = 'button',
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingPurchase, setCheckingPurchase] = useState(true)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)
  const [remainingBids, setRemainingBids] = useState(null)
  const [purchaseError, setPurchaseError] = useState(null)

  // Check if user has already purchased a bid and get remaining bid count
  // Note: getEventRevenueAction requires admin access, so this check may fail for regular users
  // In that case, we'll just not show the "already purchased" state, but the button will still work
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user?.id || !eventId) {
        setCheckingPurchase(false)
        return
      }

      try {
        // Get event revenue and check if user has a bid purchase
        // This requires admin access, so it may fail for regular users
        const { data, error } = await getEventRevenueAction(eventId)
        
        if (!error && data?.records) {
          const userBidPurchase = data.records.find(
            (record) => record.user_id === user.id && record.type === 'bid'
          )
          setAlreadyPurchased(!!userBidPurchase)

          // Calculate remaining bids if max_bids is set
          if (event?.max_bids && event.max_bids > 0) {
            const bidCount = data.records.filter(r => r.type === 'bid').length
            const remaining = event.max_bids - bidCount
            setRemainingBids(remaining > 0 ? remaining : 0)
          }
        }
        // If error is due to authorization (not admin), that's OK - we just won't show "already purchased"
      } catch (error) {
        // Silently fail - user may not be admin, which is fine
        console.debug('Could not check purchase status (may require admin access):', error)
      } finally {
        setCheckingPurchase(false)
      }
    }

    checkPurchaseStatus()
  }, [user?.id, eventId, event?.max_bids])

  const handlePurchase = async () => {
    if (disabled || loading || !eventId || !event || !event.bid_price || event.bid_price <= 0) {
      return
    }

    // Check if bids are sold out
    if (remainingBids !== null && remainingBids <= 0) {
      setPurchaseError('All bids have been sold. No more bids available.')
      return
    }

    setLoading(true)
    setPurchaseError(null)

    try {
      const { data, error } = await createStripeCheckoutSessionAction(
        eventId,
        event.bid_price,
        `Bid for ${event.title || 'Event'}`,
        'bid'
      )

      if (error) {
        console.error('Error creating checkout session:', error)
        setPurchaseError(error.message || 'Failed to create checkout session')
        if (onError) {
          onError(error.message || 'Failed to create checkout session')
        }
        setLoading(false)
        return
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error initiating bid purchase:', error)
      setPurchaseError(error.message || 'Failed to initiate payment')
      if (onError) {
        onError(error.message || 'Failed to initiate payment')
      }
      setLoading(false)
    }
  }

  // Don't show if event has no bid price
  if (!event || !event.bid_price || event.bid_price <= 0) {
    return null
  }

  // Show loading state while checking purchase status
  if (checkingPurchase) {
    return variant === 'card' ? (
      <Card variant="default" className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-light rounded w-32 mb-2" />
          <div className="h-8 bg-gray-light rounded w-24" />
        </div>
      </Card>
    ) : (
      <Button variant="primary" size="medium" disabled className="w-full">
        Loading...
      </Button>
    )
  }

  // Show purchased state
  if (alreadyPurchased) {
    return variant === 'card' ? (
      <Card variant="default" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
            <p className="text-sm text-gray-medium">Bid Price: ${event.bid_price.toFixed(2)}</p>
          </div>
          <Badge variant="status" status="active">
            Purchased
          </Badge>
        </div>
      </Card>
    ) : (
      <Button variant="secondary" size="medium" disabled className="w-full">
        Bid Purchased
      </Button>
    )
  }

  // Button variant
  if (variant === 'button') {
    const isSoldOut = remainingBids !== null && remainingBids <= 0
    return (
      <div className="w-full">
        {event.max_bids && remainingBids !== null && (
          <p className="text-sm text-gray-medium mb-2 text-center">
            {remainingBids > 0 
              ? `${remainingBids} of ${event.max_bids} bids remaining`
              : 'All bids sold out'
            }
          </p>
        )}
        {purchaseError && (
          <p className="text-sm text-red-600 mb-2 text-center">{purchaseError}</p>
        )}
      <Button
        variant="primary"
        size="medium"
        onClick={handlePurchase}
          disabled={disabled || loading || isSoldOut}
        className="w-full"
      >
          {loading ? 'Processing...' : isSoldOut ? 'Sold Out' : `Buy Bid - $${event.bid_price.toFixed(2)}`}
      </Button>
      </div>
    )
  }

  // Card variant
  const isSoldOut = remainingBids !== null && remainingBids <= 0
  return (
    <Card variant="default" className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-dark mb-1">{event.title}</h3>
          <p className="text-lg font-bold text-primary-ui">
            ${event.bid_price.toFixed(2)}
          </p>
          {event.max_bids && remainingBids !== null && (
            <p className="text-sm text-gray-medium mt-1">
              {remainingBids > 0 
                ? `${remainingBids} of ${event.max_bids} bids remaining`
                : 'All bids sold out'
              }
            </p>
          )}
        </div>
        {purchaseError && (
          <p className="text-sm text-red-600">{purchaseError}</p>
        )}
        <Button
          variant="primary"
          size="medium"
          onClick={handlePurchase}
          disabled={disabled || loading || isSoldOut}
          className="w-full"
        >
          {loading ? 'Processing...' : isSoldOut ? 'Sold Out' : 'Purchase Bid'}
        </Button>
      </div>
    </Card>
  )
}

