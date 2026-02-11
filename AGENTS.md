# AGENTS.md — Rules for AI Contributions

> Every AI agent (Claude, Copilot, Cursor, or whatever you use)
> MUST read this file before making changes.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres + Auth + Realtime + Storage) |
| Payments | Stripe |
| Styling | Tailwind CSS 3.4 |
| PWA | next-pwa |
| Language | JavaScript (no TypeScript) |

## Repo Layout

```
app/              → Pages & API routes (App Router)
app/actions/      → Server Actions (client-callable backend)
app/api/          → API routes (webhooks, etc.)
components/       → React components
components/ui/    → Reusable UI primitives
contexts/         → React contexts (auth, chat, friends, frat)
lib/supabase/     → Database functions (server-side)
lib/supabase/admin.js → Admin client (service role, for webhooks)
lib/supabase/server.js → Cookie-based client (for pages/actions)
lib/supabase/client.js → Browser client (for contexts)
scripts/          → Dev tooling and utility scripts
docs/             → Project documentation
```

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (Next.js rules)
npm run verify       # Full verification: lint + build (use before every commit)
```

## Coding Rules

### General
- **JavaScript only** — no TypeScript. Don't add `.ts` files.
- **No new dependencies** without explicit approval. Use what's in `package.json`.
- **Server Actions** go in `app/actions/`. They wrap functions from `lib/supabase/`.
- **Database logic** goes in `lib/supabase/`. Never put raw Supabase queries in components.
- All functions return `{ data, error }` pattern. Never throw from database functions.

### Frontend
- **Tailwind CSS** for all styling. No CSS modules, no styled-components.
- **`'use client'`** at the top of any component that uses hooks, state, or browser APIs.
- Components go in `components/`. Pages go in `app/**/page.js`.
- Use the UI primitives in `components/ui/` (Button, Card, Input, etc.) before creating new ones.

### Backend
- **`'use server'`** at the top of all files in `lib/supabase/` and `app/actions/`.
- Use `createClient()` from `lib/supabase/server.js` for authenticated operations.
- Use `createAdminClient()` from `lib/supabase/admin.js` ONLY for server-to-server ops (webhooks, cron).
- Never import server-only code in client components.

### Error Handling
- Use `serializeError()` from `lib/utils/errors.js` for Supabase errors.
- Always handle `{ error }` on the frontend — show the user a message, don't silently fail.
- API routes (webhooks) must ALWAYS return 200 after valid signature verification.

## Verification Protocol

Before marking any work as done, run:

```bash
npm run verify
```

This runs lint + build. **Both must pass with zero errors.**

If you add a new page or component, verify it renders by checking the build output for your route.

## Boundaries — What Agents Must NOT Do

1. **Do not modify `.env` or `.env.local`** — these contain secrets.
2. **Do not run destructive database operations** (DROP, TRUNCATE, DELETE migrations).
3. **Do not install system-level dependencies** (brew, apt, etc.).
4. **Do not modify `lib/supabase/migrations/`** without explicit approval.
5. **Do not push to `main`** — always work on a branch.
6. **Do not create test/mock files at the repo root** — use `lib/mocks/` if needed.

## Commit Messages

Use this format:
```
[area] short description

- detail 1
- detail 2
```

Areas: `stripe`, `events`, `guests`, `checkin`, `chat`, `friends`, `frat`, `auth`, `ui`, `infra`, `docs`

Example:
```
[stripe] harden webhook handler

- use admin supabase client for server-to-server calls
- always return 200 after valid signature
- add checkout.session.expired handling
```
