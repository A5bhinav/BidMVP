# PRD.md — Product Requirements & Progress

> This is the single source of truth for what's done and what's next.
> Each loop section is a batch of work. Complete all items before starting the next loop.

---

## Current Status

- **Phase 0 (Foundations):** ✅ Complete
- **Phase 1 (DoorList Core):** ✅ Complete
- **Phase 2 (Live Dashboard):** ❌ Not started
- **Infrastructure:** 🔧 In progress

---

## Loop 0: Infrastructure & Production Readiness ✅

- [x] Fix Stripe webhook — admin client, always-200, idempotency
- [x] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.example`
- [x] Exclude webhook from session middleware
- [x] Remove empty `test-messages` API route
- [x] Fix ESLint (downgrade to v8 for Next.js 14 compat)
- [x] Add Ralph Loop framework (AGENTS.md, verify.sh, ralph.md, PRD.md)

---

## Loop 1: Phase 2 — Live Event Dashboard

> **Goal:** Build the real-time event dashboard so fraternities can monitor events as they happen.
> This is the #1 feature gap for DoorList parity.

### Backend

- [ ] Add `getEventRatio(eventId)` function to `lib/supabase/events.js`
  - Query check-ins grouped by gender, return `{ male, female, other, total }`
- [ ] Add `getEventCapacity(eventId)` function to `lib/supabase/events.js`
  - Return `{ current, max, percentage, status }` where status is `ok | warning | critical | full`
- [ ] Add `subscribeToEventCheckIns(eventId, callback)` to `lib/supabase/realtime.js`
  - Real-time subscription for check-in/check-out events on a specific event
- [ ] Create server actions in `app/actions/events.js` for `getEventRatio` and `getEventCapacity`

### Frontend

- [ ] Create `app/events/[id]/live/page.js` — Live event dashboard page
  - Show ratio meter, capacity bar, live attendee list
  - Subscribe to real-time check-in updates
- [ ] Create `components/RatioMeter.js` — Gender ratio visualization
  - Horizontal stacked bar showing M/F/Other percentages
  - Color-coded segments with counts
- [ ] Create `components/CapacityBar.js` — Capacity progress bar
  - Green (<80%), Yellow (80-90%), Red (>90%), Full (100%)
  - Shows `X / Y` count
- [ ] Create `components/CapacityAlert.js` — Warning banner
  - Appears when capacity exceeds thresholds
  - Dismissible but re-appears on threshold change
- [ ] Create `components/LiveAttendeeList.js` — Real-time attendee list
  - Shows who's currently checked in, with profile photos
  - Live updates as people check in/out
- [ ] Wire live dashboard link into event detail page (`app/events/[id]/page.js`)
  - "Go Live" button visible only to event admins

### Verification

- [ ] `npm run verify` passes after all items above are complete
- [ ] Live dashboard route appears in build output

---

## Loop 2: Revenue Dashboard (Planned)

> Placeholder — details will be filled in after Loop 1 is complete.

- [ ] `getRevenueByType(eventId)` backend function
- [ ] `getRevenueCurve(eventId)` backend function (revenue over time)
- [ ] Revenue page `app/events/[id]/revenue/page.js`
- [ ] `RevenueChart.js` component
- [ ] `RevenueBreakdown.js` component
- [ ] CSV export via `ExportButton.js`

---

## Loop 3: Risk Chair Tools (Planned)

> Placeholder — details will be filled in after Loop 2 is complete.

- [ ] `lib/supabase/risk.js` backend module
- [ ] Risk dashboard page
- [ ] Alert components
- [ ] Crowd metrics visualization
