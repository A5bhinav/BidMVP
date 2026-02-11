// app/api/stripe/webhook/route.js
// Stripe webhook handler for payment confirmation
// Handles checkout.session.completed and checkout.session.expired events
//
// IMPORTANT: This endpoint receives server-to-server calls from Stripe.
// There are no cookies, no user session — we use the admin Supabase client.
// We ALWAYS return 200 after successful signature verification to prevent retries.

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// Singleton Stripe instance
let stripe = null

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  }
  return stripe
}

export async function POST(request) {
  let event

  // --- 1. Verify the webhook signature ---
  try {
    const stripeInstance = getStripe()
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    try {
      event = stripeInstance.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch (error) {
    console.error('[stripe-webhook] Setup error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // --- 2. Signature is valid. From here, ALWAYS return 200. ---
  // Stripe considers non-2xx as a failure and will retry up to 16 times.
  // We've verified this is a real Stripe event, so we should never ask for a retry.

  console.log(`[stripe-webhook] Received event: ${event.id} type=${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object
        console.log(`[stripe-webhook] Session expired: ${session.id}`, {
          eventId: session.metadata?.eventId,
          userId: session.metadata?.userId,
          type: session.metadata?.type,
        })
        // No DB action needed — the user abandoned checkout
        break
      }

      default: {
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
        break
      }
    }
  } catch (error) {
    // Log the error but still return 200 — we don't want Stripe to retry
    // because the same event will likely fail the same way
    console.error(`[stripe-webhook] Error processing event ${event.id}:`, error.message)
  }

  return NextResponse.json({ received: true })
}

/**
 * Handle a completed checkout session.
 * Records the payment in the event_revenue table and auto-approves bid purchases.
 */
async function handleCheckoutCompleted(event) {
  const session = event.data.object
  const { eventId, userId, type } = session.metadata || {}

  if (!eventId || !userId || !type) {
    console.error(`[stripe-webhook] Missing metadata in session ${session.id}:`, {
      eventId, userId, type,
    })
    return // Don't throw — we already logged it, and retrying won't add metadata
  }

  if (!['line_skip', 'bid'].includes(type)) {
    console.error(`[stripe-webhook] Unknown payment type "${type}" in session ${session.id}`)
    return
  }

  const amount = session.amount_total / 100 // Stripe amounts are in cents
  const supabase = createAdminClient()

  // --- Idempotency check ---
  // Stripe may deliver the same event more than once. Check if we've already processed it.
  const { data: existing, error: lookupError } = await supabase
    .from('event_revenue')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (lookupError) {
    console.error(`[stripe-webhook] Idempotency lookup failed for session ${session.id}:`, lookupError.message)
    // Continue anyway — worst case we get a unique constraint violation below
  }

  if (existing) {
    console.log(`[stripe-webhook] Already recorded session ${session.id}, skipping`)
    return
  }

  // --- Insert revenue record ---
  const { data: revenue, error: insertError } = await supabase
    .from('event_revenue')
    .insert({
      event_id: eventId,
      user_id: userId,
      type: type,
      amount: amount,
      stripe_session_id: session.id,
    })
    .select()
    .single()

  if (insertError) {
    console.error(`[stripe-webhook] Failed to insert revenue for session ${session.id}:`, insertError.message)
    return
  }

  console.log(`[stripe-webhook] Recorded ${type} payment: $${amount} for event ${eventId}, user ${userId}`)

  // --- For bid purchases, auto-approve the event request ---
  if (type === 'bid') {
    await autoApproveBidRequest(supabase, eventId, userId, session.id)
  }
}

/**
 * Auto-approve (or create+approve) an event request when a bid is purchased.
 * Users who pay for bids should be automatically approved for the event.
 */
async function autoApproveBidRequest(supabase, eventId, userId, sessionId) {
  try {
    // Check if the event requires approval (non-public)
    const { data: eventData, error: eventError } = await supabase
      .from('event')
      .select('id, visibility')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      console.error(`[stripe-webhook] Could not find event ${eventId} for bid auto-approve`)
      return
    }

    // Public events don't need request approval
    if (eventData.visibility === 'public') {
      return
    }

    // Check for existing request
    const { data: existingRequest } = await supabase
      .from('event_requests')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status !== 'approved') {
        await supabase
          .from('event_requests')
          .update({
            status: 'approved',
            responded_at: new Date().toISOString(),
          })
          .eq('id', existingRequest.id)

        console.log(`[stripe-webhook] Auto-approved existing request for user ${userId} on event ${eventId}`)
      }
    } else {
      await supabase
        .from('event_requests')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: 'approved',
          requested_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        })

      console.log(`[stripe-webhook] Created auto-approved request for user ${userId} on event ${eventId}`)
    }
  } catch (error) {
    // Don't fail the whole webhook over request auto-approval
    console.error(`[stripe-webhook] Failed to auto-approve bid request for session ${sessionId}:`, error.message)
  }
}
