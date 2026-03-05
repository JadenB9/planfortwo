# Wave 3+ Handoff — Remaining Work

## Status

- **Waves 1-2.5 COMPLETE and COMMITTED** (all tests passing, 260 tests across 34 files)
- **Waves 3-4 NOT STARTED** — context ran out

## Commits So Far

- `886a581` — Wave 1: Phases 6-9 (seating, vendors, events, comms, photos, registry)
- `84a01ca` — Wave 2: Phases 10-11 (post-wedding, payments, referrals, contact)
- `4723e01` — Wave 2.5: framer-motion animation polish

## Remaining Execution Order

### Pre-Wave 3: Features/Pricing Page

- `apps/web/app/features/page.tsx` already exists but needs updating
- Must show ALL features organized by category (Checklist, Guest List, Budget, Website Builder, Seating Chart, Communication, Vendors, Photos/Registry, etc.)
- FREE TIER vs PAID TIER ($200 one-time) comparison table
- Free: limited guests, basic website builder. Paid: everything
- Beautiful animations (framer-motion, use existing lib/animations.ts variants)
- "Get Started" button linking to /dashboard
- Landing page (apps/web/app/page.tsx) must have "See Features" link to /features

### Pre-Wave 3: Navigation & Auth Flow Verification

- Landing "/" -> "Get Started" -> /dashboard (requires Clerk auth)
- Landing "/" -> "See Features" -> /features
- All sidebar links must work for ALL phases (dashboard, checklist, guests, budget, website, seating, vendors, party, events, photos, registry, communication, settings)
- Clerk middleware protects /dashboard/\* routes
- Public routes: /w/[slug], /rsvp/[token], /features, /

### Wave 3: Phase 12 Hardening (from docs/planfortwo.md)

1. **Ceremony Planning Tools** — ceremony outlines, vow workspace, processional order
2. **Music/Playlist Management** — playlist builder, song requests from guests
3. **SMS Notifications** (section 12.2)
4. **Weather Integration** (section 23.9)
5. **Security Audit** — review all routes for auth, input validation, rate limiting
6. **Performance** — query optimization, caching, lazy loading
7. **Accessibility** — WCAG compliance review

### Wave 4: Final Verification Agent (THOROUGH)

Spawn ONE agent that checks:

- `pnpm type-check` passes
- `pnpm test` all pass
- `pnpm build` clean
- ALL route files in apps/api/src/routes/ registered in apps/api/src/index.ts
- ALL schema files in packages/db/src/schema/ exported from index.ts
- ALL validator files exported from packages/validators/src/index.ts
- sidebar.tsx has nav items for EVERY feature
- middleware.ts has correct public routes and protects dashboard
- features page exists with free vs paid comparison
- "Get Started" links point to /dashboard
- No orphaned files (schema without routes, routes without tests)
- Report summary of everything found

### After Wave 4 passes: `git push origin main`

## Patterns to Follow

- Service layer pattern: routes -> services -> Drizzle queries
- DB schemas in `packages/db/src/schema/`, validators in `packages/validators/src/`
- Types in `packages/types/src/index.ts`, routes in `apps/api/src/routes/`
- Tests: vitest with vi.mock for @clerk/backend and services
- Test UUIDs must use hex chars only (0-9, a-f)
- Update barrel files: schema/index.ts, validators/index.ts, types/index.ts, api/index.ts
- Gates: `pnpm type-check && pnpm test && pnpm build` must all pass before commit
- Animation variants in apps/web/lib/animations.ts, wrappers in apps/web/components/ui/motion.tsx

## Current Test Count

- 260 tests passing (251 API + 9 web) across 34 test files

## Architecture Quick Ref

- `apps/web` — Next.js 15 App Router (port 3000)
- `apps/api` — Hono.js (port 3001)
- `packages/db` — Drizzle ORM + Supabase
- `packages/types` — Shared TS types
- `packages/validators` — Shared Zod schemas
- Existing features page at: apps/web/app/features/page.tsx
- Existing sidebar at: apps/web/components/dashboard/sidebar.tsx
- Existing middleware at: apps/web/middleware.ts
- Animation lib at: apps/web/lib/animations.ts
