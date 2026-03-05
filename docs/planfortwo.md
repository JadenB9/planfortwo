# PlanForTwo — Master Build Prompt & Feature Specification

> This document is both the **build instructions for Claude Code** and the **complete feature reference** for PlanForTwo. The first half tells Claude _how_ to build. The second half tells Claude _what_ to build.

---

# PART 1: BUILD INSTRUCTIONS

---

## 0. Claude Code Prompt Directives

**READ THIS FIRST.** You are building PlanForTwo, a wedding planning platform. This section tells you exactly how to approach the build.

### 0.1 Approach Philosophy

- **Vibe-code this.** Use the `fullstack-vibe` skill as the foundation for every session. Build fast, iterate, ship.
- **Never generate AI-looking output.** Every UI, every template, every piece of copy must look like a real designer and real developer built it. No placeholder lorem ipsum. No generic gradients. No "Welcome to our app" copy. Study real wedding sites and combine the best of all of them into something unique.
- **Test-first, always.** No feature ships without tests that prove it works. Use TDD. If a test suite breaks, stop and fix it before continuing.
- **Fail-proof foundation first.** The monorepo, CI, linting, type-checking, and test infrastructure must be bulletproof before a single feature is built. Every subsequent feature builds on a foundation that catches errors before they hit production.
- **Dev and prod from day one.** Local dev, preview/staging, and production environments are set up in Phase 0. Every feature works in all three.

### 0.2 Skill Activation Map

Activate these skills at the right moments. This is mandatory, not optional.

| When                                                | Activate Skill                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Starting any build session**                      | `fullstack-vibe` — sets up the vibe coding workflow                                       |
| **Before any creative/design work**                 | `superpowers:brainstorming` — brainstorm before building                                  |
| **Any frontend UI work**                            | `ui-ux-pro-max` — design intelligence for every component                                 |
| **Building pages, components, layouts**             | `frontend-design` — production-grade frontend interfaces                                  |
| **Planning a new phase/milestone**                  | `gsd:plan-phase` or `gsd:new-project` — structured planning                               |
| **Executing a planned phase**                       | `gsd:execute-phase` — structured execution with atomic commits                            |
| **Writing any new feature code**                    | `superpowers:test-driven-development` — write tests first                                 |
| **Writing API endpoints**                           | `everything-claude-code:api-design` + `everything-claude-code:backend-patterns`           |
| **Database schema changes**                         | `everything-claude-code:database-migrations` + `everything-claude-code:postgres-patterns` |
| **Frontend component patterns**                     | `everything-claude-code:frontend-patterns`                                                |
| **Before any library/framework API call**           | Look up docs via **Context7 MCP** — never guess APIs                                      |
| **Writing E2E tests**                               | `everything-claude-code:e2e-testing` or `everything-claude-code:e2e`                      |
| **Security-sensitive code (auth, payments, input)** | `secure` + `everything-claude-code:security-review`                                       |
| **Ready to push code**                              | `push` — human-style git push                                                             |
| **Deploying to Vercel**                             | `vercel:setup` / `vercel:deploy`                                                          |
| **Completing a major feature**                      | `superpowers:verification-before-completion` — verify before claiming done                |
| **After writing significant code**                  | `superpowers:requesting-code-review` — get code reviewed                                  |
| **Multi-step implementation**                       | `superpowers:writing-plans` then `superpowers:executing-plans`                            |
| **Independent parallel tasks**                      | `superpowers:dispatching-parallel-agents`                                                 |
| **Debugging an issue**                              | `superpowers:systematic-debugging` or `gsd:debug`                                         |
| **Auditing completed work**                         | `audit-project:audit-project`                                                             |
| **Full PR workflow**                                | `ship:ship`                                                                               |
| **Coding standards enforcement**                    | `everything-claude-code:coding-standards`                                                 |
| **Deployment pipeline work**                        | `everything-claude-code:deployment-patterns`                                              |

### 0.3 MCP Integration Points

Use these Claude-connected tools throughout the build:

| MCP Tool                                                            | When to Use                                                                                                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context7** (`mcp__plugin_context7_context7`)                      | Before using ANY library API. Look up Next.js App Router, Hono, Drizzle, Clerk, Stripe, Inngest, Resend, dnd-kit, Tiptap, Recharts, Konva, Zod — every time. Never guess. |
| **Cloudflare MCP** (`mcp__claude_ai_Cloudflare_Developer_Platform`) | Create R2 buckets (dev + prod), manage DNS records, search Cloudflare docs for Workers/R2/DNS configuration, query D1 if needed.                                          |
| **Vercel MCP** (via `vercel:setup` / `vercel:deploy` skills)        | Set up project, deploy, check logs, manage environment variables.                                                                                                         |
| **Claude in Chrome** (`mcp__claude-in-chrome`)                      | Design research — browse real wedding sites, take screenshots, analyze layouts, study competitor UX flows.                                                                |
| **claude-mem** (`mcp__plugin_claude-mem_mcp-search`)                | Search for previous session context, code patterns, and decisions. Use `smart_search` and `smart_outline` for navigating the growing codebase.                            |

### 0.4 Code Style Rules

- TypeScript strict mode. No `any`. Ever.
- All code must look student-written per Jaden's coding style — no over-engineered enterprise patterns.
- No AI attribution in commits. No `Co-Authored-By` lines.
- Conventional commit messages.
- Tailwind CSS for all styling — no CSS modules, no styled-components.
- Server Components by default in Next.js. Client Components only when interactivity is needed.
- All API routes validate with Zod. All frontend forms validate with Zod.
- Drizzle ORM for all database queries. No raw SQL unless absolutely necessary.
- React Query (TanStack Query) for all client-side data fetching.

---

## 1. Manual Setup Checklist (YOU, Jaden — Not Claude)

Claude cannot create accounts or enter credentials for you. You must complete every item below before Claude can build against it. After each step, add the relevant API keys/URLs to your `.env.local` files.

### 1.1 Accounts to Create

| #   | Service        | URL                    | What to Do                                                                                                                                                                   | Keys You'll Get                                                                                               |
| --- | -------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | **GitHub**     | github.com/new         | Create `JadenB9/planfortwo` repo (private), set up `main` + `dev` branches, enable branch protection on both                                                                 | Repo URL                                                                                                      |
| 2   | **Vercel**     | vercel.com/new         | Connect GitHub repo, create project, set framework to Next.js                                                                                                                | `VERCEL_TOKEN`, project ID                                                                                    |
| 3   | **Supabase**   | supabase.com/dashboard | Create TWO projects: `planfortwo-dev` and `planfortwo-prod`. Enable Row Level Security. Note the connection strings, anon key, service role key for each.                    | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (x2 for dev/prod)            |
| 4   | **Clerk**      | clerk.com              | Create TWO applications: dev and prod. Enable Email+Password, Google OAuth, Apple sign-in. Set up redirect URLs.                                                             | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` (x2)                          |
| 5   | **Stripe**     | stripe.com             | Create account. Get test mode keys immediately. Set up a Product for the $200 one-time purchase. Create a webhook endpoint pointing to `api.planfortwo.com/webhooks/stripe`. | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`                     |
| 6   | **Cloudflare** | cloudflare.com         | Create account. Add `planfortwo.com` domain (buy it here or transfer nameservers). Create TWO R2 buckets: `planfortwo-dev` and `planfortwo-prod`.                            | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |
| 7   | **Railway**    | railway.app            | Create account. Create a new project. Add a service for the Hono API. Connect GitHub repo. Set up auto-deploy from `dev` and `main` branches.                                | `RAILWAY_TOKEN`, API URL                                                                                      |
| 8   | **Resend**     | resend.com             | Create account. Verify `planfortwo.com` domain (add DNS records in Cloudflare). Create API key.                                                                              | `RESEND_API_KEY`                                                                                              |
| 9   | **Inngest**    | inngest.com            | Create account. Create TWO environments: dev and prod. Note the event keys and signing keys.                                                                                 | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`                                                                    |
| 10  | **Sentry**     | sentry.io              | Create account. Create TWO projects: `planfortwo-web` (Next.js) and `planfortwo-api` (Node).                                                                                 | `SENTRY_DSN` (x2), `SENTRY_AUTH_TOKEN`                                                                        |

### 1.2 OAuth Provider Setup (Manual)

These require developer console access that Claude cannot perform:

- **Google OAuth:** Go to [console.cloud.google.com](https://console.cloud.google.com), create OAuth 2.0 credentials, add authorized redirect URIs from Clerk dashboard. Copy Client ID + Secret into Clerk.
- **Apple Sign-In:** Go to [developer.apple.com](https://developer.apple.com), create a Services ID, configure Sign in with Apple, add Clerk's callback URL. Copy credentials into Clerk.

### 1.3 DNS Records (Manual in Cloudflare)

After Vercel and Railway are set up, add these DNS records in Cloudflare:

| Type      | Name                        | Target                                              | Proxy |
| --------- | --------------------------- | --------------------------------------------------- | ----- |
| CNAME     | `app`                       | `cname.vercel-dns.com`                              | Yes   |
| CNAME     | `api`                       | Railway service URL                                 | Yes   |
| CNAME     | `*`                         | `cname.vercel-dns.com` (wildcard for wedding sites) | Yes   |
| TXT/CNAME | Resend verification records | (from Resend dashboard)                             | No    |
| TXT/CNAME | Clerk verification records  | (from Clerk dashboard)                              | No    |

### 1.4 Stripe Webhook Setup (Manual)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.planfortwo.com/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.deleted`
4. Copy the webhook signing secret to your env

### 1.5 After All Accounts Are Created

Tell Claude: "All accounts are set up. Here are my environment variables." Then provide the `.env` values (Claude will create the `.env.local` and `.env.example` files in the correct locations). **Never commit `.env` files to git.**

---

## 2. Design Research Protocol

### 2.1 Competitor Sites to Study

Before designing any UI, use **Claude in Chrome** browser automation to visit and screenshot these sites. Analyze their strengths and weaknesses:

| Site               | URL                                 | Study For                                                            |
| ------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| **Zola**           | zola.com                            | Best-in-class wedding website builder, clean onboarding, registry UX |
| **The Knot**       | theknot.com                         | Feature breadth, checklist UX, vendor directory                      |
| **Joy**            | withjoy.com                         | Modern design, mobile experience, photo sharing                      |
| **Minted**         | minted.com/wedding                  | Premium stationery aesthetic, typography, print-to-digital           |
| **Riley & Grey**   | rileyandgrey.com                    | Luxury wedding website templates, editorial design                   |
| **Appy Couple**    | appycouple.com                      | App-like experience, guest-facing UX                                 |
| **Paperless Post** | paperlesspost.com                   | Digital stationery design, animation, elegance                       |
| **Squarespace**    | squarespace.com (wedding templates) | Template builder UX, drag-and-drop editing                           |
| **WithJoy**        | withjoy.com                         | Free tier generosity, RSVP flow, clean mobile                        |
| **Brides.com**     | brides.com                          | Content/editorial style, how-to guides                               |

### 2.2 What to Extract From Each

For every site, document:

1. **Typography** — What font pairings do they use? Serif + sans-serif combos?
2. **Color palettes** — Muted tones? Bold? What makes it feel "wedding" not "SaaS"?
3. **Spacing & whitespace** — How generous is the breathing room?
4. **Hero sections** — What makes their first impression memorable?
5. **Navigation** — Top nav? Side nav? Bottom mobile nav? How many items?
6. **Animations** — Subtle scroll reveals? Page transitions? Hover effects?
7. **Mobile experience** — How does the dashboard feel on a phone?
8. **Onboarding** — How many steps? What do they ask? How does it feel?
9. **Empty states** — What do pages look like before the user adds data?
10. **Wedding website templates** — Which designs feel timeless vs trendy?

### 2.3 Design Principles for PlanForTwo

Based on the research, every UI must follow these rules:

- **Warm, not corporate.** This is about a wedding, not a B2B dashboard. Soft colors, elegant typography, emotional design.
- **Generous whitespace.** Let content breathe. Never cram features into a page.
- **Serif + sans-serif pairing.** Headings in a beautiful serif (Playfair Display, Cormorant Garamond, or similar). Body in a clean sans-serif (Inter, DM Sans, or similar).
- **Subtle animations.** Framer Motion for page transitions, scroll reveals, micro-interactions. Never jarring. Never slow.
- **Photography-forward.** Large image areas. Beautiful image cropping. Photos should be the hero, not UI chrome.
- **Consistent component language.** Every button, card, input, modal follows the same design language across all pages.
- **Mobile-first.** Design for phone first, then expand to desktop. The couple will use this on their phone 70% of the time.
- **Empty states are opportunities.** When a page has no data, show a beautiful illustration and a clear CTA. Never show a blank table.
- **Progressive disclosure.** Don't overwhelm. Show the essential, hide the advanced behind expandable sections or secondary tabs.

### 2.4 Template Design Approach

For the 10+ wedding website templates:

1. Study the best templates from Zola, Minted, Riley & Grey, and Squarespace
2. Identify the 10 most popular "styles" (Classic, Modern, Rustic, Romantic, Minimalist, etc.)
3. For each style, combine the best layout from one site + best typography from another + best color approach from another
4. Every template must look like it was designed by a human designer, not generated by AI
5. Use real-looking placeholder content (realistic couple names, real venue names, actual dates)
6. Each template must be fully responsive and look stunning on mobile

---

## 3. Fail-Proof Foundation & TDD Rules

### 3.1 Foundation Requirements (Phase 0 — Must Pass Before ANY Feature)

Before writing a single feature, the following must all be green:

```
pnpm install          # All deps install cleanly
pnpm type-check       # Zero TypeScript errors
pnpm lint             # Zero ESLint errors
pnpm format:check     # Prettier formatting passes
pnpm test             # All tests pass (even if there's only one smoke test)
pnpm build            # Both apps build successfully
pnpm dev              # Both apps start and respond to requests
```

These commands must pass at ALL TIMES throughout the entire build. If any breaks, stop and fix it before continuing.

### 3.2 TDD Rules (Every Feature)

For every feature, follow this exact order:

1. **Write the test first.** Describe what the feature should do in test form.
2. **Run the test.** Watch it fail (red).
3. **Write the minimum code** to make the test pass (green).
4. **Refactor** while keeping tests green.
5. **Run the full test suite** to ensure nothing else broke.

Use the `superpowers:test-driven-development` skill to enforce this workflow.

### 3.3 Test Categories & When to Write Them

| Test Type             | Tool                           | Write For                                                                           | Minimum Coverage   |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------------- | ------------------ |
| **Unit**              | Vitest                         | All shared packages (validators, types, utils), all business logic in Hono handlers | 80%+               |
| **API Integration**   | Vitest + supertest             | Every Hono endpoint — happy path + error cases + auth checks                        | 100% of endpoints  |
| **Component**         | Vitest + React Testing Library | Complex interactive components (seating chart, budget tracker, website editor)      | Key interactions   |
| **E2E**               | Playwright                     | Every critical user flow (see list below)                                           | All critical paths |
| **Visual Regression** | Playwright screenshots         | All 10+ wedding website templates at 3 viewport sizes                               | All templates      |

### 3.4 Critical Path E2E Tests (Must Always Pass)

These Playwright tests run on every PR and must never break:

1. **Auth Flow:** Sign up → verify email → land on dashboard
2. **Onboarding:** Complete onboarding wizard → see populated dashboard
3. **Guest Flow:** Add guest → edit guest → delete guest → bulk import CSV
4. **RSVP Flow:** Guest receives link → opens RSVP → submits → couple sees response
5. **Checklist Flow:** View checklist → add task → complete task → see progress update
6. **Budget Flow:** Set budget → add expense → see analytics update
7. **Website Builder:** Select template → edit content → preview → publish
8. **Purchase Flow:** Free user → click upgrade → Stripe checkout (test mode) → unlock paid features
9. **Seating Chart:** Create layout → add table → assign guests → export PDF
10. **Guest Portal:** Magic link → view events → submit RSVP → upload photo

### 3.5 Continuous Validation

- **Pre-commit hook (Husky):** Runs `lint-staged` (lint + format + type-check on staged files)
- **Pre-push hook:** Runs `pnpm test` (all unit + API tests)
- **CI on every PR:** Full pipeline — install → type-check → lint → test → build → E2E
- **Merge blocked** if any check fails
- **Every Claude Code session** should start with `pnpm test` to verify the codebase is healthy

---

## 4. Project Scaffolding (Phase 0 — Exact Steps)

Claude will execute these steps to create the monorepo foundation. Run these in order.

### 4.1 Monorepo Structure

```
planfortwo/
├── apps/
│   ├── web/                    # Next.js app (Vercel)
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Client utilities
│   │   ├── public/             # Static assets
│   │   ├── styles/             # Global styles
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── .env.local          # (gitignored)
│   └── api/                    # Hono app (Railway)
│       ├── src/
│       │   ├── routes/         # Route handlers by feature
│       │   ├── middleware/     # Auth, validation, error handling
│       │   ├── lib/            # Server utilities
│       │   └── index.ts        # Hono app entry
│       ├── tsconfig.json
│       └── .env.local          # (gitignored)
├── packages/
│   ├── db/                     # Drizzle schema + migrations + seed
│   │   ├── schema/             # Table definitions by feature
│   │   ├── migrations/         # Generated SQL migrations
│   │   ├── seed.ts             # Realistic test data
│   │   ├── drizzle.config.ts
│   │   └── index.ts            # Drizzle client export
│   ├── types/                  # Shared TypeScript types
│   │   └── index.ts
│   ├── validators/             # Shared Zod schemas
│   │   └── index.ts
│   ├── ui/                     # Shared UI components (design system)
│   │   ├── components/
│   │   └── index.ts
│   ├── email/                  # React Email templates
│   │   ├── templates/
│   │   └── index.ts
│   └── config/                 # Shared ESLint, TypeScript, Tailwind configs
│       ├── eslint.js
│       ├── tsconfig.base.json
│       └── tailwind.preset.js
├── docker-compose.yml          # Local Postgres
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .env.example                # All env vars documented
├── CLAUDE.md                   # Project-level Claude instructions
└── .github/
    └── workflows/
        └── ci.yml              # GitHub Actions CI pipeline
```

### 4.2 Scaffolding Commands (Claude Executes)

```bash
# 1. Initialize monorepo
pnpm init
# Configure pnpm-workspace.yaml with apps/* and packages/*

# 2. Install Turborepo
pnpm add -D turbo -w

# 3. Scaffold Next.js app
cd apps && pnpm create next-app web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 4. Scaffold Hono API
mkdir -p api/src && cd api && pnpm init
# Install: hono, @hono/node-server, drizzle-orm, zod

# 5. Create shared packages
mkdir -p packages/{db,types,validators,ui,email,config}
# Initialize each with package.json and tsconfig.json

# 6. Set up Docker Compose for local Postgres
# docker-compose.yml with postgres:16 + volume

# 7. Configure Turborepo pipelines
# turbo.json with build, dev, lint, type-check, test pipelines

# 8. Set up testing infrastructure
# Vitest config in apps/web, apps/api, and packages/*
# Playwright config in apps/web

# 9. Set up linting and formatting
# ESLint + Prettier configs in packages/config, extended by all apps

# 10. Set up Husky + lint-staged
pnpm add -D husky lint-staged -w
pnpm husky init

# 11. Create CI workflow
# .github/workflows/ci.yml

# 12. Create CLAUDE.md for the project
```

### 4.3 CLAUDE.md for This Project

Claude must create a `CLAUDE.md` in the project root with:

```markdown
# PlanForTwo — Project Instructions

## Stack

- Frontend: Next.js 15 (App Router) on Vercel
- Backend: Hono.js on Railway
- Database: Supabase (Postgres) + Drizzle ORM
- Auth: Clerk
- Payments: Stripe
- Background Jobs: Inngest
- Email: Resend + React Email
- Storage: Cloudflare R2
- Validation: Zod (shared)
- Monorepo: Turborepo + pnpm

## Commands

- `pnpm dev` — Start both apps (web :3000, api :3001)
- `pnpm build` — Build all apps and packages
- `pnpm test` — Run all tests
- `pnpm test:unit` — Unit tests only
- `pnpm test:api` — API integration tests only
- `pnpm test:e2e` — Playwright E2E tests
- `pnpm lint` — Lint all packages
- `pnpm type-check` — TypeScript check all packages
- `pnpm format` — Format all files
- `pnpm db:push` — Push schema to dev DB
- `pnpm db:generate` — Generate migration files
- `pnpm db:migrate` — Run migrations
- `pnpm db:seed` — Seed database with test data
- `pnpm db:reset` — Drop, recreate, seed
- `pnpm email:dev` — Preview email templates

## Rules

- Always run `pnpm test` before committing
- Never skip TypeScript strict mode
- Always validate with Zod on both client and server
- Use Context7 before any library API call
- Write tests before writing feature code
- No `any` types
- No AI attribution in commits
```

---

## 5. Phased Build Plan

Each phase is a milestone. Complete one before starting the next. Use `gsd:plan-phase` at the start of each phase and `gsd:execute-phase` to build it.

### Phase 0: Foundation (Week 1)

**Goal:** Monorepo scaffolded, all tooling works, CI green, dev environment running.

- [ ] Scaffold Turborepo monorepo (structure from 4.1)
- [ ] Configure pnpm workspaces + Turborepo pipelines
- [ ] Set up Next.js app with Tailwind + App Router
- [ ] Set up Hono API with basic health endpoint
- [ ] Set up Docker Compose for local Postgres
- [ ] Configure Drizzle ORM with first schema (users, weddings tables)
- [ ] Set up shared packages (types, validators, config)
- [ ] Configure ESLint, Prettier, TypeScript strict mode
- [ ] Set up Husky + lint-staged pre-commit hooks
- [ ] Set up Vitest for unit/API tests + Playwright for E2E
- [ ] Write first smoke tests (API health check, homepage renders)
- [ ] Create GitHub Actions CI pipeline
- [ ] Create `.env.example` with all variables documented
- [ ] Create CLAUDE.md
- [ ] Verify: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint` all pass

**Exit criteria:** All commands green. Both apps start. CI passes on GitHub.

### Phase 1: Auth & Onboarding (Week 2)

**Goal:** Couple can sign up, invite partner, and complete onboarding.

- [ ] Integrate Clerk (sign-up, login, Google OAuth, Apple)
- [ ] Clerk webhook → Hono → create User + Wedding records in Supabase
- [ ] Partner invitation flow (email invite via Resend)
- [ ] Onboarding wizard (names, date, guest count, budget, style, timeline)
- [ ] Protected dashboard route (redirect if not authed)
- [ ] Basic dashboard layout (sidebar nav, top bar, content area)
- [ ] Drizzle schema: users, weddings, wedding_members
- [ ] Tests: auth flow E2E, webhook handler unit, onboarding E2E

**Exit criteria:** Two users can create accounts, link as a couple, complete onboarding, see dashboard.

### Phase 2: Dashboard & Checklist (Week 3)

**Goal:** Couple sees a useful dashboard and can manage their planning checklist.

- [ ] Dashboard: countdown, quick stats, upcoming tasks, activity feed
- [ ] Planning checklist with default timeline templates (12/6/18-month)
- [ ] Task CRUD: add, edit, complete, delete, reorder (drag-and-drop)
- [ ] Task categories, priority levels, assignment to partner
- [ ] Progress tracking (overall %, per-category bars)
- [ ] File attachments on tasks (Cloudflare R2)
- [ ] Shared realtime checklist (Supabase Realtime)
- [ ] Tests: task CRUD API tests, checklist E2E, progress calculation unit tests

**Exit criteria:** Dashboard shows real data. Checklist is fully functional with drag-and-drop.

### Phase 3: Guest List & RSVP (Weeks 4-5)

**Goal:** Full guest management and digital RSVP system.

- [ ] Guest CRUD: add, edit, delete individual guests
- [ ] Bulk import (CSV upload, parsed on backend)
- [ ] Household grouping, tags, plus-one management
- [ ] Dietary & accessibility tracking with aggregation
- [ ] Guest search and filtering (advanced filters)
- [ ] Digital RSVP form (per-event, meal selection, dietary, song request, custom Qs)
- [ ] RSVP access: unique link, household code, QR code, name lookup
- [ ] RSVP tracking dashboard with charts
- [ ] RSVP reminders (Inngest scheduled → Resend email)
- [ ] RSVP deadline with auto-cutoff
- [ ] Guest magic link authentication (Clerk)
- [ ] Tests: guest CRUD API, bulk import, RSVP submission E2E, reminder scheduling

**Exit criteria:** 200 guests can be managed. RSVPs can be sent, received, tracked, and reminded.

### Phase 4: Budget Tracker (Week 6)

**Goal:** Full budget management with analytics.

- [ ] Budget setup wizard (total budget, category allocation)
- [ ] Expense CRUD with receipt uploads
- [ ] Payment schedule with calendar view
- [ ] Budget analytics (spent vs allocated, burn rate, per-guest cost)
- [ ] Tip calculator by vendor type
- [ ] Split costs tracking (couple, bride's family, groom's family)
- [ ] Budget export (CSV + PDF)
- [ ] Payment reminder emails (Inngest → Resend)
- [ ] Tests: budget calculation unit tests, expense API tests, analytics aggregation

**Exit criteria:** Budget is fully functional with real analytics and export capabilities.

### Phase 5: Wedding Website Builder (Weeks 7-9)

**Goal:** Couple can build and publish a beautiful wedding website.

- [ ] **Design research first** — use Claude in Chrome to study competitor sites (section 2.1)
- [ ] Design 10+ template components (Classic, Modern, Rustic, Romantic, etc.)
- [ ] Website section system (hero, story, events, party, gallery, travel, registry, FAQ, RSVP, schedule, guestbook)
- [ ] Website editor: drag-and-drop sections, rich text (Tiptap), photo upload, color picker, font selector
- [ ] Mobile preview toggle + live preview
- [ ] Custom domain support (Cloudflare DNS + Vercel)
- [ ] Website privacy controls (public, password, unlisted)
- [ ] Website analytics (views, visitors, sections, RSVP conversion)
- [ ] SEO & Open Graph meta tags
- [ ] Subdomain routing: `yournames.planfortwo.com`
- [ ] Visual regression tests for all templates at 3 viewports
- [ ] Tests: template rendering, editor interactions, domain setup, privacy middleware

**Exit criteria:** A wedding website is indistinguishable from a professionally designed site. All 10 templates are beautiful.

### Phase 6: Seating Chart (Week 10)

**Goal:** Visual drag-and-drop seating chart with export.

- [ ] Canvas-based venue layout builder (Konva.js)
- [ ] Table types (round, rectangular, head table, sweetheart)
- [ ] Non-table elements (dance floor, bar, stage)
- [ ] Guest drag-and-drop assignment with search/filter
- [ ] Relationship mapping (must sit together, keep apart)
- [ ] Capacity warnings and conflict detection
- [ ] Multiple charts per event
- [ ] Export: PDF layout, alphabetical list, table-by-table list, place cards
- [ ] Tests: assignment logic, conflict detection, export generation

**Exit criteria:** Seating chart is intuitive, handles 200+ guests, exports print-ready.

### Phase 7: Communication & Stationery (Week 11)

**Goal:** Email announcements, stationery suite.

- [ ] Email composer (rich text, photo embed, recipient filtering)
- [ ] Email templates (save-the-date, invitation, update, reminder, thank-you)
- [ ] Scheduled sends with open/click tracking
- [ ] Guest announcements (portal feed + notification triggers)
- [ ] Digital stationery suite (save-the-date, invitation, program, menu, place cards, thank-you)
- [ ] Stationery editor matching wedding website design
- [ ] Print-ready PDF export (proper DPI, bleed marks)
- [ ] Tests: email send flow, template rendering, PDF generation

**Exit criteria:** Couple can send beautiful emails and generate print-ready stationery.

### Phase 8: Vendors, Wedding Party, Events (Week 12)

**Goal:** Vendor management, party coordination, multi-event support.

- [ ] Vendor list with status tracking (kanban board)
- [ ] Vendor communication log with file attachments
- [ ] Contract management with deadline tracking
- [ ] Wedding party member management with roles
- [ ] Party tasks, outfit coordination, gift tracking
- [ ] Party portal (restricted access via Clerk roles)
- [ ] Multi-event support with day-of timeline builder
- [ ] Shareable role-specific timelines (PDF + link)
- [ ] Tests: vendor CRUD, party portal access control, timeline generation

**Exit criteria:** All vendor and party management features functional.

### Phase 9: Photos, Registry, Design Tools (Week 13)

**Goal:** Photo sharing, registry, mood boards.

- [ ] Guest photo upload (chunked upload, QR code at reception)
- [ ] Photo gallery with moderation, download, slideshow
- [ ] Professional photo integration
- [ ] Universal registry links with click tracking
- [ ] Cash/experience fund with Stripe contributions
- [ ] Group gifting with progress tracking
- [ ] Gift tracker with thank-you note linking
- [ ] Mood board builder
- [ ] Color palette generator
- [ ] Style quiz
- [ ] Photo shot list
- [ ] Tests: upload flow, Stripe webhook, gallery rendering

**Exit criteria:** Full media and registry experience working.

### Phase 10: Post-Wedding, Settings, Polish (Week 14)

**Goal:** Post-wedding features, account settings, PWA, dark mode.

- [ ] Thank-you note manager (auto-populated from gifts)
- [ ] Name change checklist
- [ ] Marriage license tracker
- [ ] Post-wedding vendor reviews
- [ ] Wedding recap / stats page
- [ ] Anniversary reminder emails (Inngest cron)
- [ ] Notification preferences
- [ ] Privacy controls
- [ ] Data export (JSON, CSV, photos ZIP, static HTML)
- [ ] Account deletion with 30-day grace period
- [ ] PWA configuration (add to home screen, offline viewing)
- [ ] Dark mode (dashboard only, not wedding websites)
- [ ] Tests: post-wedding triggers, export generation, deletion flow

**Exit criteria:** Full lifecycle covered from engagement to anniversary.

### Phase 11: Landing Page, Payments, Growth (Week 15)

**Goal:** Public marketing site, Stripe purchase flow, referral program.

- [ ] Landing page at `planfortwo.com` (features, pricing, testimonials, demo)
- [ ] Pricing page with free vs paid comparison
- [ ] Stripe Checkout integration for $200 one-time purchase
- [ ] Feature gating (free tier limits enforced)
- [ ] Referral program (unique links, tracking, rewards)
- [ ] Admin dashboard (user metrics, revenue, content moderation)
- [ ] Help center / FAQ pages
- [ ] Contact form with email routing
- [ ] SEO optimization (blog structure for future content)
- [ ] Tests: purchase flow E2E (Stripe test mode), feature gating, referral tracking

**Exit criteria:** A stranger can visit planfortwo.com, sign up, try free, purchase, and use everything.

### Phase 12: Advanced Features & Hardening (Week 16+)

**Goal:** Polish, advanced features, security hardening.

- [ ] Ceremony planning tools (outline builder, vow workspace, processional order)
- [ ] Music & playlist management (must-play, do-not-play, song requests)
- [ ] Weather integration (Open-Meteo API)
- [ ] Honeymoon planning section
- [ ] Wedding hashtag generator
- [ ] Emergency day-of toolkit
- [ ] Print-at-home templates
- [ ] Couple's private journal
- [ ] Social sharing (OG image generation)
- [ ] Offline support (service worker, IndexedDB)
- [ ] Live day-of updates (Supabase Realtime + push notifications)
- [ ] Full security audit (`/secure` skill)
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Tests: all new features, full security scan, accessibility checks

**Exit criteria:** Production-ready. Every feature works. Every test passes. Security audited.

---

## 6. Dev & Prod Environment Setup

### 6.1 Local Development

```bash
# Start local Postgres
docker compose up -d

# Start both apps (web :3000, api :3001)
pnpm dev

# In separate terminals if needed:
pnpm --filter web dev        # Next.js only
pnpm --filter api dev        # Hono only
pnpm email:dev               # React Email preview
stripe listen --forward-to localhost:3001/webhooks/stripe   # Stripe webhooks
npx inngest-cli@latest dev   # Inngest dev server
```

### 6.2 Preview/Staging (Auto-Deploys from `dev` Branch)

- Vercel: auto-deploys preview URL per PR
- Railway: deploys `dev` branch to `api-dev.planfortwo.com`
- Supabase: `planfortwo-dev` project
- Clerk: dev instance
- Stripe: test mode keys
- Resend: dev API key (emails don't send)
- Inngest: dev environment

### 6.3 Production (Auto-Deploys from `main` Branch)

- Vercel: `app.planfortwo.com`
- Railway: `api.planfortwo.com`
- Supabase: `planfortwo-prod` project
- Clerk: prod instance
- Stripe: live mode keys
- Resend: production (emails send for real)
- Inngest: production environment
- Sentry: error tracking active
- Cloudflare: proxy enabled, caching active, DDoS protection on

### 6.4 Environment Variable Management

- `.env.local` in each app (gitignored)
- `.env.example` committed with every variable name + description (no values)
- Vercel environment variables set per environment (Preview, Production)
- Railway environment variables set per environment
- Never hardcode secrets. Never commit `.env` files.

---

## 7. Additional Build Features (Every Small Detail)

Beyond the feature spec below, ensure these small but important details are implemented:

### 7.1 UX Micro-Features

- Loading skeletons on every data-fetching page (never blank white screens)
- Optimistic UI updates (action feels instant, syncs in background)
- Toast notifications for all user actions (saved, deleted, error)
- Undo support where possible (deleted a guest? Undo within 5 seconds)
- Keyboard shortcuts for power users (Cmd+K command palette)
- Breadcrumb navigation on all nested pages
- "Last saved X minutes ago" indicators on editor pages
- Confetti animation when completing major milestones (all RSVPs in, all tasks done)
- Smooth page transitions (Framer Motion)
- Scroll-to-top on navigation
- Infinite scroll or pagination (never load 500 guests at once)

### 7.2 Trust & Polish Signals

- Favicon + web app manifest (proper PWA icons)
- Custom 404 page with helpful navigation
- Custom error boundary pages (something went wrong)
- Footer with links (privacy policy, terms, contact, social)
- "Made with love" or similar warm branding (not "Powered by AI")
- Real testimonials placeholder (structure ready for real quotes)
- Status page link (for uptime transparency)
- Cookie consent banner (GDPR)
- Accessible color contrast (AA minimum)
- Print stylesheet for pages that might be printed

### 7.3 Performance

- Next.js Image component for all images (lazy loading, WebP, responsive)
- Dynamic imports for heavy components (seating chart canvas, rich text editor)
- React Query caching with stale-while-revalidate
- Cloudflare CDN caching for static assets
- Database query optimization (indexes on all frequently queried columns)
- Lighthouse score target: 90+ on Performance, Accessibility, Best Practices, SEO

### 7.4 Security (Non-Negotiable)

- All API endpoints authenticated (Clerk middleware on Hono)
- Row Level Security on every Supabase table
- CSRF protection on all forms
- Rate limiting on API (especially RSVP submission, email sends)
- Input sanitization (XSS prevention)
- SQL injection prevention (Drizzle ORM parameterized queries)
- Secure headers (HSTS, X-Frame-Options, CSP)
- Stripe webhook signature verification
- Clerk webhook signature verification
- File upload validation (type, size, content sniffing)
- No sensitive data in URLs or logs
- Regular dependency audit (`pnpm audit`)

---

# PART 2: FEATURE SPECIFICATION

> Everything below is the complete feature reference. Each feature includes the exact stack mapping for implementation.

---

# PlanForTwo — Complete Feature Outline & Stack Mapping

> "Pay once, plan your wedding without ads or upsells. Ever."

**Product:** PlanForTwo — Comprehensive wedding planning platform
**Domain:** planfortwo.com
**Pricing:** Free tier (limited) + $200 one-time full access
**Target:** Engaged couples planning their wedding

---

## Stack Overview

| Layer           | Tool                                      | Role                                                          |
| --------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Frontend        | **Next.js** (App Router) on **Vercel**    | All UI, wedding websites, couple dashboard                    |
| Backend API     | **Hono.js** on **Railway**                | REST API, webhook handlers, business logic                    |
| Database        | **Supabase** (Postgres) + **Drizzle ORM** | All persistent data, RLS for multi-tenant security            |
| Auth            | **Clerk**                                 | Couple accounts, guest magic links, wedding party invites     |
| Payments        | **Stripe**                                | One-time purchase, cash registry, vendor payments             |
| Background Jobs | **Inngest**                               | Email sequences, reminders, photo processing, scheduled tasks |
| Email           | **Resend** + **React Email**              | Transactional emails, RSVP notifications, guest announcements |
| File Storage    | **Cloudflare R2**                         | Photos, documents, wedding website assets                     |
| DNS / CDN       | **Cloudflare**                            | Domain management, DDoS protection, caching, custom domains   |
| Validation      | **Zod** (shared package)                  | Input validation shared between frontend and backend          |
| Type Safety     | **TypeScript** (strict)                   | Shared types across all packages                              |
| Monorepo        | **Turborepo** + **pnpm**                  | Build orchestration, dependency management                    |

---

## Pricing Tiers

### Free Tier

Just enough to get hooked. Couple creates an account, starts planning, hits walls that make $200 feel like nothing compared to their $30K wedding.

- Planning checklist (view default template, can't customize)
- Guest list (max 15 guests)
- 1 basic wedding website template (with "Powered by PlanForTwo" branding)
- Budget overview (total only, no category breakdown)
- No RSVP system
- No seating chart
- No vendor management
- No stationery
- No custom domain

### Full Access — $200 One-Time

Everything. Forever. No subscriptions, no upsells, no ads.

- All features listed in this document
- All website templates
- Unlimited guests
- Custom domain support
- Full RSVP system
- Seating chart
- Vendor management
- Stationery suite
- Photo sharing
- SMS notifications
- Priority support
- Data export

---

## 1. Authentication & Accounts

### 1.1 Couple Registration

- Email + password sign-up
- Google OAuth sign-up
- Apple sign-up
- Partner invitation (one creates, invites the other via email)
- Both partners get co-owner access to the wedding

**Stack:** Clerk handles all auth flows. Clerk webhook → Hono API → creates Wedding + User records in Supabase via Drizzle. Resend sends the partner invite email.

### 1.2 Guest Authentication

- Magic link access (no password, no account creation)
- Email-based verification
- Guests access their personalized portal via unique link
- No sign-up friction — click link, see your info

**Stack:** Clerk magic links for guest auth. Hono API validates guest identity against Supabase guest records. Next.js renders personalized guest portal.

### 1.3 Wedding Party Access

- Invite links sent to bridesmaids, groomsmen, etc.
- Limited access: see their tasks, timeline, and group chat
- Can't edit wedding details, budget, or vendor info

**Stack:** Clerk invitation flow with custom role metadata. Hono API enforces role-based permissions. Supabase RLS policies restrict data access by role.

### 1.4 Wedding Planner / Family Access

- Optional: invite a professional planner or family member
- Custom permission levels (view only, edit checklist, manage vendors, etc.)
- Activity log shows who changed what

**Stack:** Clerk custom roles with granular permissions stored in Supabase. Hono middleware checks permissions per endpoint. Drizzle audit log table tracks changes.

---

## 2. Wedding Dashboard

### 2.1 Countdown

- Days until wedding
- Days until next milestone
- Visual countdown widget

**Stack:** Next.js client component. Wedding date stored in Supabase, rendered on frontend.

### 2.2 Quick Stats

- Total guests invited / RSVPs received / pending
- Budget spent / remaining
- Checklist items completed / remaining
- Website views count

**Stack:** Hono API aggregation endpoints pulling from Supabase. Next.js dashboard page with stat cards. Real-time updates via React Query polling.

### 2.3 Upcoming Tasks

- Next 5 checklist items due
- Upcoming vendor payments
- Overdue items highlighted

**Stack:** Hono API queries Supabase for tasks ordered by due date. Next.js renders task list with overdue styling.

### 2.4 Recent Activity Feed

- "Sarah added 12 guests"
- "RSVP received from John Smith"
- "Photographer contract uploaded"
- Activity from both partners and system events

**Stack:** Supabase activity_log table populated by Hono API on every action. Next.js renders chronological feed. Inngest can batch-process activity summaries.

### 2.5 Quick Actions

- Add a guest
- Update budget
- Send an announcement
- Preview wedding website

**Stack:** Next.js modal components with forms. Zod validates input client-side. Hono API processes mutations.

---

## 3. Planning Checklist

### 3.1 Default Timeline Templates

- 12-month planning timeline (most common)
- 6-month accelerated timeline
- 18-month extended timeline
- Elopement timeline (1-3 months)
- Each comes pre-populated with ~80-120 tasks

**Stack:** Supabase seeded with template data. On wedding creation, Hono API clones the selected template into the couple's checklist. Drizzle handles the bulk insert.

### 3.2 Task Management

- Title, description, due date, category
- Mark complete / incomplete
- Assign to partner (bride/groom task split)
- Priority levels (must-do, nice-to-have, optional)
- Notes per task
- Attach files to tasks (contracts, inspiration photos)
- Reorder tasks via drag-and-drop

**Stack:** Supabase tasks table with wedding_id foreign key. Hono CRUD endpoints. Next.js drag-and-drop UI (dnd-kit library). File attachments stored in Cloudflare R2, references in Supabase.

### 3.3 Custom Tasks

- Add your own tasks to the timeline
- Set custom due dates
- Categorize into existing or new categories

**Stack:** Same Supabase tasks table, Hono API, Next.js form. Zod validates task input.

### 3.4 Task Categories

- Venue & Catering
- Photography & Video
- Flowers & Decor
- Music & Entertainment
- Attire & Beauty
- Stationery & Invitations
- Transportation & Logistics
- Legal & Paperwork
- Gifts & Registry
- Honeymoon
- Wedding Party
- Guests & Seating
- Ceremony
- Reception
- Custom categories

**Stack:** Supabase categories table. Hono API for CRUD. Next.js filter/group UI on checklist page.

### 3.5 Progress Tracking

- Overall completion percentage
- Per-category progress bars
- "On track" / "Behind" / "Ahead" status based on due dates vs wedding date
- Weekly progress summary email

**Stack:** Hono API calculates progress metrics from Supabase task data. Next.js progress visualization (progress bars, charts). Inngest scheduled job sends weekly summary via Resend.

### 3.6 Shared Checklist

- Both partners see the same checklist in real-time
- See who completed what
- Comment on tasks

**Stack:** Supabase with real-time subscriptions (Supabase Realtime) for live updates. Next.js renders updates without refresh. Hono API handles mutations.

---

## 4. Guest List Management

### 4.1 Guest Entry

- Add individual guests (name, email, phone, address)
- Bulk import from CSV/Excel
- Bulk import from contacts (Google Contacts integration)
- Duplicate detection

**Stack:** Hono API endpoints for single + bulk guest creation. CSV parsing on the backend (papaparse). Next.js upload UI. Zod validates guest data. Supabase guests table. Inngest processes large CSV imports as background jobs.

### 4.2 Household Grouping

- Group guests into households ("The Smith Family")
- One invitation per household
- Individual RSVP per person within household
- Shared address for physical invitations

**Stack:** Supabase households table with guests linked via household_id. Hono API manages grouping. Next.js drag-to-group UI.

### 4.3 Guest Tags & Groups

- Bride's side / Groom's side
- Family / Friends / Work / Neighbors
- Custom tags
- VIP designation
- Filter and sort by any tag

**Stack:** Supabase many-to-many relationship (guests_tags junction table). Hono API filter endpoints. Next.js multi-select tag UI with filtering.

### 4.4 Plus-One Management

- Mark guests who get a plus-one
- Named plus-one (you know who they're bringing)
- Unnamed plus-one (they tell you via RSVP)
- Plus-one dietary tracking

**Stack:** Supabase plus_one fields on guest record (has_plus_one, plus_one_name, plus_one_confirmed). Hono API logic. Next.js toggle UI.

### 4.5 Dietary & Accessibility Tracking

- Dietary restrictions per guest (vegetarian, vegan, gluten-free, kosher, halal, allergies, other)
- Accessibility needs (wheelchair, hearing assistance, etc.)
- Aggregated counts for vendors ("12 vegetarian, 3 gluten-free, 2 vegan")
- Export dietary summary for caterer

**Stack:** Supabase JSONB field for dietary/accessibility on guest record. Hono API aggregation endpoint. Next.js summary dashboard with export to CSV/PDF.

### 4.6 Guest Contact Info

- Email, phone, mailing address per guest
- Address book for physical invitations
- Export mailing labels (formatted for printing)

**Stack:** Supabase guest fields. Hono API export endpoints (CSV, formatted label PDF). Next.js address management UI.

### 4.7 Kids vs Adults Tracking

- Mark guests as adults or children
- Separate counts for venue capacity and catering
- Children's meal tracking
- Childcare coordination info

**Stack:** Supabase is_child boolean + age field on guest record. Hono API aggregation. Next.js dashboard stat.

### 4.8 Travel & Accommodation Tracking

- Mark guests as local or traveling
- Hotel block assignment
- Travel arrival/departure dates
- Airport pickup coordination
- Group rate tracking

**Stack:** Supabase guest travel fields (is_traveling, hotel_block_id, arrival_date, departure_date). Hono API. Next.js travel dashboard tab.

### 4.9 Guest Search & Filtering

- Search by name, email, tag, table, RSVP status
- Advanced filters (traveling + no hotel, dietary + no RSVP)
- Saved filter views

**Stack:** Hono API with complex Drizzle query builder for filtered searches. Supabase full-text search on guest names. Next.js search bar + filter sidebar.

---

## 5. RSVP System

### 5.1 Digital RSVP

- Beautiful RSVP form matching wedding website design
- Per-guest or per-household RSVP
- Accept / Decline per event (ceremony, reception, rehearsal dinner)
- Meal selection
- Dietary restrictions input
- Song request
- Custom questions (couple can add their own)
- Plus-one name entry
- Notes/message to the couple

**Stack:** Next.js RSVP form page (public, no auth needed — accessed via unique link or code). Zod validates all input. Hono API processes submission, updates Supabase guest record. Resend sends confirmation email to guest. Inngest triggers notification to couple.

### 5.2 RSVP Tracking Dashboard

- Total invited vs responded vs pending
- Accepted vs declined breakdown
- Per-event attendance counts
- Meal choice aggregation
- Visual charts and graphs
- Export for caterer/venue

**Stack:** Hono API aggregation endpoints from Supabase RSVP data. Next.js dashboard with charts (Recharts or Chart.js). Export via Hono CSV/PDF endpoints.

### 5.3 RSVP Reminders

- Automated email reminders for non-responders
- Customizable reminder schedule (3 weeks, 1 week, 3 days before deadline)
- Couple can trigger manual reminder blasts
- Reminder frequency cap (don't annoy people)
- Track which reminders were sent and opened

**Stack:** Inngest scheduled functions check Supabase for non-responded guests at configured intervals. Resend sends reminder emails with React Email templates. Supabase tracks reminder history (sent_at, opened_at).

### 5.4 RSVP Deadline

- Set RSVP deadline date
- Automatic cutoff (form closes after deadline, shows message)
- Grace period option (accept late RSVPs for X days after)

**Stack:** Supabase wedding.rsvp_deadline field. Next.js RSVP form checks deadline before rendering. Hono API rejects late submissions unless grace period active.

### 5.5 RSVP Access Methods

- Unique link per guest (emailed)
- Unique code per household (for physical invitation inserts: "RSVP at planfortwo.com/rsvp with code SMITH2026")
- QR code on physical invitations linking to RSVP page
- Name lookup (guest types their name to find their RSVP)

**Stack:** Supabase rsvp_code and rsvp_token fields on guest/household records. Hono API validates codes/tokens. Next.js multiple entry-point UIs. QR code generation via library on backend.

---

## 6. Budget Tracker

### 6.1 Budget Setup

- Set total wedding budget
- Auto-suggest category allocation based on total (industry averages)
- Manual category allocation
- Adjust allocations anytime

**Stack:** Supabase budget table linked to wedding. Hono API with budget template data (percentage breakdowns by total). Next.js budget setup wizard.

### 6.2 Expense Categories

- Venue (ceremony + reception)
- Catering & Bar
- Photography
- Videography
- Flowers & Decor
- Music / DJ / Band
- Wedding Attire (dress, suit, alterations, accessories)
- Hair & Makeup
- Wedding Cake / Desserts
- Stationery (save-the-dates, invitations, programs, menus, place cards, thank-you cards)
- Transportation
- Favors
- Officiant
- Rentals (tables, chairs, linens, lighting, tent)
- Photo Booth
- Wedding Planner / Coordinator
- Gifts (wedding party, parents)
- Rings
- Marriage License & Legal
- Rehearsal Dinner
- Honeymoon
- Tips & Gratuities
- Emergency Fund / Buffer
- Custom categories

**Stack:** Supabase budget_categories table with default seed data. Hono API CRUD. Next.js category management UI.

### 6.3 Expense Tracking

- Add individual expenses with: vendor, category, amount, date, paid/unpaid, notes
- Receipt/invoice upload per expense
- Mark as deposit, partial payment, or paid in full
- Running total per category and overall

**Stack:** Supabase budget_items table. File uploads to Cloudflare R2 with reference in Supabase. Hono CRUD API. Next.js expense list with add/edit modals.

### 6.4 Payment Schedule

- Calendar view of upcoming payments
- Overdue payment alerts
- Vendor-linked payment milestones (deposit due, balance due)
- Payment method notes

**Stack:** Supabase payment_schedule table linked to budget_items and vendors. Hono API. Next.js calendar component. Inngest sends payment reminder emails via Resend 7 days and 1 day before due.

### 6.5 Budget Analytics

- Spent vs allocated per category (bar chart)
- Overall budget burn rate
- Projected total based on current spending
- Cost-per-guest metric
- Over-budget / under-budget indicators
- Monthly spending trend

**Stack:** Hono API aggregation endpoints with Drizzle queries. Next.js chart components (Recharts). Real-time updates as expenses are added.

### 6.6 Tip Calculator

- Suggested tip amounts by vendor type (industry standard)
- Catering: 15-20% of food/bev total
- DJ/Band: $50-150
- Photographer: $50-200
- Hair/Makeup: 15-20%
- Transportation: 15-20%
- Officiant: $50-100
- Total tip budget line item

**Stack:** Hono API with tip calculation logic based on vendor type and amounts. Next.js tip calculator widget on budget page. Supabase stores couple's tip decisions.

### 6.7 Split Costs

- Track who's paying for what (couple, bride's family, groom's family, other)
- Per-expense payer assignment
- Summary of each party's total contribution
- Percentage breakdown

**Stack:** Supabase payer field on budget_items (enum: couple, bride_family, groom_family, other). Hono aggregation API. Next.js split view dashboard.

### 6.8 Budget Export

- Export full budget as CSV
- Export as formatted PDF
- Export summary for parents/family contributing

**Stack:** Hono API export endpoints generating CSV and PDF (using pdfkit or similar). Next.js download buttons.

---

## 7. Wedding Website Builder

### 7.1 Template Selection

- 10+ professionally designed templates
- Styles: Classic, Modern, Rustic, Romantic, Minimalist, Bohemian, Garden, Beach, Elegant, Whimsical
- Preview before selecting
- Change template anytime (content carries over)

**Stack:** Next.js template components. Each template is a React component with the same data interface but different styling. Template selection stored in Supabase. Vercel serves the wedding websites.

### 7.2 Website Sections (Customizable)

- **Hero** — Names, date, location, photo
- **Our Story** — How we met, proposal story, timeline of relationship with photos
- **Event Details** — Ceremony and reception info with maps (Google Maps embed)
- **Wedding Party** — Photos and bios of bridesmaids, groomsmen, parents
- **Gallery** — Engagement photos, couple photos
- **Travel & Accommodations** — Hotel blocks with booking links, airport info, driving directions
- **Things To Do** — Local restaurants, attractions, activities for out-of-town guests
- **Registry** — Links to registries (any platform) + cash fund
- **FAQ** — Dress code, parking, kids policy, plus-ones, social media hashtag, weather tips
- **RSVP** — Embedded RSVP form (links to the RSVP system)
- **Schedule** — Multi-event schedule (welcome party, ceremony, reception, brunch)
- **Guestbook** — Digital message board for guests to leave notes
- **Custom Pages** — Couple can add any additional pages

**Stack:** Next.js dynamic pages rendered from Supabase content. Each section is a content block stored as structured data (not raw HTML) in Supabase. Hono API serves content. Couple edits via Next.js CMS-like editor in their dashboard. Photos stored in Cloudflare R2.

### 7.3 Website Editor

- Drag-and-drop section ordering
- Rich text editing for content blocks
- Photo upload and cropping
- Color customization (primary, secondary, accent, background)
- Font selection from curated pairs
- Mobile preview toggle
- Live preview as you edit

**Stack:** Next.js editor page with drag-and-drop (dnd-kit), rich text (Tiptap or Plate), image upload to Cloudflare R2 via Hono API presigned URLs. All content saved to Supabase. Preview renders the actual template component with current data.

### 7.4 Custom Domain

- Default: `yournames.planfortwo.com` (free)
- Custom domain: `ourwedding.com` (paid tier)
- SSL automatically provisioned
- DNS setup instructions provided

**Stack:** Cloudflare for DNS management and SSL. Vercel custom domain mapping. Supabase stores domain config. Hono API handles domain verification. Cloudflare API for automated DNS record creation.

### 7.5 Website Privacy

- Public (anyone with link)
- Password protected (guests enter a shared password)
- Unlisted (only accessible via direct link, not indexed)

**Stack:** Next.js middleware checks privacy setting from Supabase before rendering. Password stored hashed in Supabase. Robots.txt dynamically set based on privacy choice.

### 7.6 Website Analytics

- Total page views
- Unique visitors
- Most viewed sections
- Visitor countries/regions
- RSVP conversion rate (visited site → completed RSVP)

**Stack:** Lightweight analytics tracking via Hono API endpoint (no third-party trackers). Events stored in Supabase. Next.js analytics dashboard for couple.

### 7.7 SEO & Social Sharing

- Custom meta title and description
- Open Graph image (auto-generated from hero section or custom upload)
- Twitter/social media card preview
- Wedding hashtag integration

**Stack:** Next.js metadata API for dynamic SEO tags. Open Graph image generation via Next.js OG image route or Cloudflare Worker. Supabase stores SEO settings.

---

## 8. Seating Chart

### 8.1 Venue Layout Builder

- Upload venue floor plan image as background
- OR draw floor plan from scratch
- Place tables on the floor plan (drag and drop)
- Table types: round (8-12 seats), rectangular (6-20 seats), banquet/long (10-30 seats), head table, sweetheart table
- Resize and rotate tables
- Add non-table elements (dance floor, stage, bar, DJ booth, photo booth, gift table, dessert table, entrance)
- Zoom and pan

**Stack:** Next.js canvas-based editor (Konva.js or Fabric.js). Venue layout data stored as JSON in Supabase. Floor plan images in Cloudflare R2. Hono API for save/load.

### 8.2 Guest Assignment

- Drag guests from unassigned list to table seats
- Search guests while assigning
- Filter by group/tag
- See dietary restrictions while placing (icon indicators)
- Warnings: table over capacity, separated couples, known conflicts
- Auto-suggest seating based on tags/groups

**Stack:** Next.js drag-and-drop UI. Supabase table_assignments junction table (guest_id, table_id, seat_number). Hono API for bulk assignment operations. Conflict detection logic in Hono.

### 8.3 Relationship Mapping

- Tag guest relationships: must sit together, prefer together, keep apart
- Family group auto-seating
- "Drama zones" — flag guests who shouldn't be near each other
- Visual indicators on the chart

**Stack:** Supabase guest_relationships table (guest_a_id, guest_b_id, relationship_type). Hono API conflict-checking endpoint. Next.js visual indicators on seating chart.

### 8.4 Multiple Seating Charts

- Different charts for different events (rehearsal dinner vs reception)
- Copy and modify charts between events

**Stack:** Supabase seating_charts table with event_id foreign key. Hono API clone endpoint. Next.js chart switcher UI.

### 8.5 Seating Chart Export

- Print-ready PDF of the full layout
- Alphabetical guest list with table numbers
- Table-by-table guest list
- Place card template (printable name cards)
- Digital display version (for welcome sign / screen at reception)

**Stack:** Hono API PDF generation (pdfkit). Next.js export UI with format options. Cloudflare R2 for generated PDF storage.

---

## 9. Vendor Management

### 9.1 Vendor Directory (Future — Phase 3)

- Searchable vendor marketplace by category, location, budget
- Vendor profiles with portfolios, pricing, availability
- Verified reviews from real PlanForTwo weddings
- "Request Quote" functionality
- Vendor comparison tool

**Stack:** Supabase vendors table with full-text search + PostGIS for location queries. Hono API search endpoints. Next.js vendor browse/search pages. Stripe Connect for vendor payments (future). Cloudflare R2 for vendor portfolio images.

### 9.2 Couple's Vendor List

- Add vendors you're considering or booked
- Track status: researching, contacted, quoted, booked, paid, completed
- Vendor contact info storage
- Category assignment

**Stack:** Supabase couple_vendors table linked to wedding_id. Hono CRUD API. Next.js vendor management page with kanban-style status board.

### 9.3 Vendor Communication Log

- Log calls, emails, meetings with each vendor
- Attach files (quotes, proposals, inspiration)
- Date and notes per interaction
- Follow-up reminders

**Stack:** Supabase vendor_communications table. Cloudflare R2 for file attachments. Hono API. Next.js timeline view per vendor. Inngest scheduled reminders via Resend.

### 9.4 Contract Management

- Upload vendor contracts
- Track key dates: signing date, deposit due, balance due, cancellation deadline
- Contract status: pending, signed, active, completed
- Payment milestone tracking linked to budget

**Stack:** Cloudflare R2 for contract PDF storage. Supabase contracts table with date fields. Hono API. Next.js contract viewer with status indicators. Inngest deadline reminder emails via Resend.

### 9.5 Vendor Reviews (Post-Wedding)

- Prompt couple to review vendors after the wedding
- Star rating + text review
- Photo uploads from the wedding
- Reviews visible to future couples on vendor directory

**Stack:** Inngest post-wedding trigger (30 days after wedding date) sends review prompt via Resend. Supabase vendor_reviews table. Hono API. Next.js review submission form.

---

## 10. Wedding Party Management

### 10.1 Party Members

- Add members with role: Maid of Honor, Best Man, Bridesmaid, Groomsman, Flower Girl, Ring Bearer, Usher, Reader, Officiant, Musician, MC, Custom
- Contact info, photo
- Bride's side / Groom's side designation

**Stack:** Supabase wedding_party table. Cloudflare R2 for photos. Hono CRUD API. Next.js party management page.

### 10.2 Party Tasks

- Assign tasks to party members (pick up decorations, hold rings, give toast)
- Tasks visible on member's portal
- Status tracking

**Stack:** Supabase party_tasks table linked to wedding_party member. Hono API. Next.js task list per member.

### 10.3 Outfit Coordination

- Dress color, style, designer for bridesmaids
- Suit specs for groomsmen
- Accessory details (shoes, ties, jewelry)
- Fitting dates and notes
- Photo reference uploads

**Stack:** Supabase outfit_details JSONB field on wedding_party record. Cloudflare R2 for reference photos. Next.js outfit coordination page.

### 10.4 Party Portal

- Each party member gets a personal portal (accessed via invite link)
- Their tasks, their timeline, outfit info
- Group chat with other party members
- Can't see budget or vendor details (privacy)

**Stack:** Clerk invite link with party_member role. Next.js party portal pages with restricted data. Hono API role-based filtering. Supabase RLS policies.

### 10.5 Gift Tracking

- Track gifts given to party members (bridesmaids gifts, groomsmen gifts)
- Budget per person
- Ideas list
- Purchased / not purchased status

**Stack:** Supabase party_gifts table. Hono API. Next.js gift tracker page.

---

## 11. Events & Timeline

### 11.1 Multi-Event Support

- Create multiple events under one wedding:
  - Engagement Party
  - Bridal Shower
  - Bachelor Party
  - Bachelorette Party
  - Rehearsal Dinner
  - Welcome Party
  - Wedding Ceremony
  - Cocktail Hour
  - Reception
  - After-Party
  - Morning-After Brunch
  - Custom events
- Each event has: date, time, location, description, dress code, guest list subset

**Stack:** Supabase events table linked to wedding_id. Hono CRUD API. Next.js event management page. Event details feed into wedding website.

### 11.2 Day-Of Timeline Builder

- Minute-by-minute schedule for each event
- Entries: time, description, responsible person, location/room, notes
- Vendor arrival and setup times
- Hair/makeup schedule
- Photo session schedule
- Transportation schedule

**Stack:** Supabase timeline_entries table linked to event_id. Hono API with ordering logic. Next.js drag-and-drop timeline editor.

### 11.3 Shareable Timelines

- Generate role-specific timelines:
  - Vendor timeline (only entries relevant to them)
  - Wedding party timeline
  - Family timeline
  - Photographer shot schedule
- Share via link or email
- PDF export

**Stack:** Hono API generates filtered timeline views based on role/tag. Resend sends timeline emails. Hono generates PDF exports. Next.js shareable timeline page (public link).

### 11.4 Live Day-Of Updates

- Real-time schedule changes pushed to everyone
- "Ceremony starting 15 minutes late"
- Push notifications (browser) + SMS (paid tier)
- Couple or coordinator can update from phone

**Stack:** Supabase Realtime for live updates. Next.js service worker for push notifications. Inngest triggers SMS via Twilio or similar when timeline changes. Mobile-responsive Next.js update UI.

---

## 12. Guest Communication

### 12.1 Email Announcements

- Compose and send emails to all guests or filtered groups
- Templates: save-the-date, invitation, update, reminder, thank-you
- Rich text editor with photo embedding
- Schedule sends for specific date/time
- Track opens and clicks

**Stack:** Next.js email composer with rich text (Tiptap). React Email templates for rendering. Hono API queues email jobs. Inngest processes email sends in batches (rate limiting). Resend sends emails with tracking. Supabase stores email history and tracking data.

### 12.2 SMS Notifications (Paid Tier)

- Text updates to guests who opt in
- Day-of alerts (ceremony starting, location change)
- RSVP reminders via text
- Character-limited, concise messages

**Stack:** Hono API SMS endpoint. Inngest batch processing. Twilio or similar SMS provider (integrated via Hono). Supabase stores phone numbers and opt-in status.

### 12.3 Guest Announcements

- Post updates visible on guest portal
- "We changed venues!"
- "Parking update"
- "Don't forget to RSVP by Friday"
- Notification triggers (email and/or SMS based on preference)

**Stack:** Supabase announcements table. Hono API. Next.js announcement feed on guest portal. Inngest triggers notifications via Resend/SMS when announcement is published.

---

## 13. Design & Inspiration

### 13.1 Mood Board Builder

- Save images from anywhere (upload or paste URL)
- Organize into boards (ceremony, reception, flowers, attire, decor)
- Add notes to each image
- Share boards with vendors or wedding party

**Stack:** Cloudflare R2 for image storage. Supabase mood_boards and mood_board_items tables. Hono API with image upload endpoint. Next.js masonry grid layout with drag-and-drop organization.

### 13.2 Color Palette Generator

- Pick 3-5 wedding colors
- See them together in preview swatches
- Suggested complementary palettes based on style
- Color codes (hex, RGB) for sharing with vendors
- Apply palette to wedding website automatically

**Stack:** Next.js color picker components. Supabase stores palette on wedding record. Color palette data feeds into website template rendering.

### 13.3 Style Quiz

- Answer 10-15 questions about preferences
- Get matched to a wedding style (Rustic, Modern, Classic, Bohemian, etc.)
- Suggested website templates based on style
- Suggested color palettes based on style

**Stack:** Next.js quiz UI. Hono API scoring logic. Results stored in Supabase wedding profile. Next.js results page with recommendations.

### 13.4 Photo Shot List

- Customizable checklist for photographer
- Default shot list template (50+ must-have shots)
- Add custom shots
- Organize by time of day (getting ready, ceremony, portraits, reception)
- Share with photographer via link or PDF

**Stack:** Supabase shot_list table. Hono API with template seeding. Next.js checklist UI. Hono PDF export endpoint.

---

## 14. Stationery Suite (Paid Tier)

### 14.1 Digital Stationery

- Save-the-Date (digital, email or shareable link)
- Wedding Invitation (digital)
- RSVP Card (integrated with RSVP system)
- Wedding Program
- Menu Cards
- Place Cards / Escort Cards
- Table Numbers
- Thank-You Cards
- All matching the wedding website design / color palette

**Stack:** Next.js stationery editor with live preview. React Email templates for digital sends. Supabase stores stationery content. Hono API for generation. Resend for email delivery of digital stationery. Cloudflare R2 for generated assets.

### 14.2 Print-Ready Export

- Download high-resolution PDFs for printing
- Standard print sizes (5x7, 4x6, A5)
- Bleed marks and trim lines
- CMYK color conversion notes

**Stack:** Hono API PDF generation with proper DPI and sizing (pdfkit or Puppeteer for HTML-to-PDF). Cloudflare R2 for generated files. Next.js download UI.

### 14.3 Print Partnerships (Future)

- Order physical prints directly through PlanForTwo
- Partner with print shops (Minted, Shutterfly, local printers)
- Price comparison
- Proofing workflow

**Stack:** Hono API integration with print partner APIs. Stripe for payment processing. Inngest for order tracking and status updates.

---

## 15. Photo & Video Sharing

### 15.1 Guest Photo Upload

- Guests upload photos from the wedding day
- Upload via wedding website or dedicated photo page
- QR code displayed at reception (scan → upload page)
- No app download required (web-based)
- Batch upload support
- Auto-rotate and basic quality optimization

**Stack:** Next.js upload page (chunked uploads for large files). Hono API upload endpoint with presigned URLs to Cloudflare R2. Inngest background job for image processing (resize, thumbnail, EXIF rotation). Supabase photos table tracks metadata.

### 15.2 Photo Gallery

- All uploaded photos in a shared gallery
- Couple can moderate (approve/reject before public)
- Sort by upload time, guest name
- Download individual or all photos as ZIP
- Slideshow mode

**Stack:** Supabase photos table with moderation_status field. Cloudflare R2 for originals + thumbnails. Hono API for gallery endpoints. Next.js gallery page with lightbox viewer. Hono generates ZIP downloads.

### 15.3 Professional Photo Integration

- Photographer uploads final edited photos to a delivery gallery
- Couple reviews and selects favorites
- Share selected photos with guests
- Download in full resolution

**Stack:** Same infrastructure as guest uploads but with a separate "professional" gallery. Cloudflare R2 storage. Access control via Clerk roles.

### 15.4 QR Code Generator

- Auto-generate QR code linking to photo upload page
- Downloadable for printing (welcome sign, table cards, etc.)
- Custom branding on QR code frame
- Track scans

**Stack:** Hono API QR code generation (qrcode library). Next.js display/download UI. Cloudflare R2 for generated QR images.

### 15.5 Video Links

- Embed or link to wedding video when ready
- Support YouTube, Vimeo, or direct upload
- Accessible from wedding website and guest portal

**Stack:** Supabase video_url field. Next.js video embed component on wedding website. Direct video upload to Cloudflare R2 (with size limits).

---

## 16. Registry Integration

### 16.1 Universal Registry Links

- Link to registries from any platform (Amazon, Target, Crate & Barrel, Zola, etc.)
- Display on wedding website registry page
- Track which registries guests visit (click tracking)

**Stack:** Supabase registry_links table. Hono API with click tracking. Next.js registry page on wedding website with branded buttons per retailer.

### 16.2 Cash / Experience Fund

- Create custom cash funds (Honeymoon Fund, House Fund, Date Night Fund, etc.)
- Set goals per fund with progress bar
- Guests contribute any amount via Stripe
- Message with gift
- Processing fee: 2.5% (platform revenue)

**Stack:** Stripe Payment Links or Stripe Checkout for contributions. Supabase cash_funds table with goal_amount and current_amount. Hono API webhook handler for Stripe payments updates Supabase totals. Next.js fund display on wedding website with progress bars. Inngest sends thank-you notification to couple when contribution received (via Resend).

### 16.3 Group Gifting

- Expensive items can be split among multiple guests
- Progress bar shows how much is funded
- Each contributor gets credit for thank-you notes

**Stack:** Supabase group_gifts table with contribution tracking. Stripe for payments. Hono API for contribution processing. Next.js group gift display component.

### 16.4 Gift Tracker

- Automatic tracking of gifts received (from cash fund)
- Manual entry for physical gifts
- Link gift to guest for thank-you notes
- Status: received, thank-you sent

**Stack:** Supabase gifts table linked to guest_id. Hono API. Next.js gift tracker page integrated with thank-you note manager.

---

## 17. Post-Wedding Features

### 17.1 Thank-You Note Manager

- Auto-populated list from gift tracker
- Template thank-you note generator
- Track status: not started, drafted, sent
- Mailing address available per guest
- Digital thank-you option (email via Resend)

**Stack:** Supabase thank_you_notes table linked to gifts and guests. Hono API. Next.js checklist UI. Resend for digital thank-you emails with React Email templates. Inngest reminders if thank-you notes are overdue (2 weeks, 1 month after wedding).

### 17.2 Name Change Checklist

- Step-by-step guide for legal name change
- Checklist of institutions to notify:
  - Social Security Administration
  - DMV / Driver's License
  - Passport
  - Bank accounts
  - Credit cards
  - Employer / HR
  - Insurance
  - Utilities
  - Subscriptions
  - Social media
- Document requirements per step
- Track completion

**Stack:** Supabase name_change_tasks table (seeded from template). Hono API. Next.js checklist page. Static content — no external API needed.

### 17.3 Marriage License Tracker

- Reminder to apply for license (varies by state)
- Filing deadline after ceremony
- Required documents checklist
- State-specific information

**Stack:** Supabase static reference data for state requirements. Inngest scheduled reminders via Resend. Next.js info page.

### 17.4 Vendor Reviews

- Prompted 2-4 weeks after wedding
- Rate vendors you used
- Write review
- Upload wedding photos from that vendor's work
- Reviews visible on vendor directory

**Stack:** Inngest triggers review prompt email via Resend at configured interval after wedding date. Supabase vendor_reviews table. Hono API. Next.js review form.

### 17.5 Wedding Recap / Stats

- Auto-generated summary:
  - Total guests attended
  - Total budget spent vs planned
  - Number of photos uploaded
  - Most popular song request
  - Fun stats and data visualizations
- Shareable recap page

**Stack:** Hono API aggregation endpoint compiling stats from all Supabase tables. Next.js recap page with visualizations. Shareable public link.

### 17.6 Anniversary Reminders

- Annual anniversary email
- "1 year ago today..." with a photo from the wedding
- Keeps couple engaged with the platform long-term
- Subtle re-engagement for referrals

**Stack:** Inngest annual cron job checks Supabase for wedding anniversaries. Resend sends anniversary email with React Email template. Supabase stores wedding date.

---

## 18. Account & Settings

### 18.1 Couple Profile

- Both partners' names, emails, photos
- Wedding date, venue, location
- Wedding style / theme
- Social media handles / wedding hashtag

**Stack:** Clerk user profiles + Supabase wedding record. Hono API. Next.js settings page.

### 18.2 Notification Preferences

- Email notification toggles (RSVP received, payment reminder, task due, etc.)
- Digest frequency (instant, daily, weekly)
- SMS opt-in/out
- Push notification preferences

**Stack:** Supabase notification_preferences table. Hono API. Next.js settings page. Inngest respects preferences before sending via Resend.

### 18.3 Privacy Controls

- Wedding website visibility (public, password, unlisted)
- Guest list privacy (who can see other guests)
- Photo sharing permissions
- Search engine indexing toggle

**Stack:** Supabase privacy settings on wedding record. Hono API middleware enforces privacy. Next.js settings toggles.

### 18.4 Collaborator Management

- Invite/remove partners, planners, family members
- Set permission levels per collaborator
- View activity log per user

**Stack:** Clerk organization/team features. Supabase collaborators table with role field. Hono API permission middleware. Next.js collaborator management page.

### 18.5 Data Export

- Download all data as JSON or CSV
- Photos as ZIP
- Full wedding website as static HTML
- GDPR-compliant data portability

**Stack:** Hono API export endpoints generating ZIP/JSON/CSV. Inngest background job for large exports. Cloudflare R2 for temporary export storage. Resend notifies when export is ready.

### 18.6 Account Deletion

- Full data removal
- Cancel any active subscriptions
- Remove all files from storage
- Confirmation required
- 30-day grace period before permanent deletion

**Stack:** Hono API deletion endpoint marks account for deletion in Supabase. Inngest scheduled job permanently deletes after 30 days (Supabase data + Cloudflare R2 files + Clerk account). Stripe cancels any subscriptions.

---

## 19. Mobile Experience

### 19.1 Responsive Web App

- Full mobile-responsive design (not a native app)
- Touch-friendly interactions
- Bottom navigation on mobile
- Swipe gestures where appropriate
- Works on all modern browsers

**Stack:** Next.js with Tailwind CSS responsive utilities. Mobile-first design approach. No native app needed — PWA capabilities for "add to home screen."

### 19.2 Progressive Web App (PWA)

- "Add to Home Screen" prompt
- App-like experience without app store
- Offline support for viewing (not editing)
- Push notifications via service worker

**Stack:** Next.js PWA configuration (next-pwa or manual service worker). Caching strategy for offline viewing. Web Push API for notifications.

### 19.3 Day-Of Mobile Mode

- Simplified interface focused on:
  - Timeline view
  - Quick updates
  - Contact list (vendor phone numbers)
  - Emergency info
- Large tap targets, easy to use in hectic environment

**Stack:** Next.js dedicated `/day-of` route with simplified mobile UI. Supabase Realtime for live timeline updates. All existing data, just a focused view.

---

## 20. Admin & Internal Tools

### 20.1 Admin Dashboard (Internal)

- User metrics (signups, conversions, churn)
- Revenue tracking (Stripe dashboard integration)
- Feature usage analytics
- Support ticket management
- Content moderation (vendor reviews, guest photos)

**Stack:** Separate Next.js admin app or protected admin routes. Hono admin API endpoints. Supabase admin queries. Stripe API for revenue data. Clerk admin SDK for user management.

### 20.2 Customer Support

- In-app help center with FAQ / knowledge base
- Contact form
- Email support
- Priority support badge for paid users

**Stack:** Next.js help center pages (static content). Hono API for contact form submission. Resend sends support emails. Supabase stores support tickets.

---

## 21. Development & Testing Environment

### 21.1 Local Development Setup

- Single command to spin up entire stack locally (`pnpm dev`)
- Turborepo runs both apps in parallel (web on :3000, api on :3001)
- Docker Compose for local Postgres (no Supabase dependency for offline dev)
- Hot reload on both frontend and backend
- Shared packages rebuild automatically on change
- `.env.example` files for both apps with every variable documented
- Seed script to populate database with realistic test data (fake couples, guests, budgets)

**Stack:** Turborepo `dev` pipeline runs Next.js and Hono concurrently. Docker Compose spins up Postgres locally. Drizzle connects to local DB or Supabase based on env. pnpm workspace handles shared packages.

### 21.2 Database Management

- Drizzle schema files as source of truth
- `drizzle-kit push` for quick dev iteration (schema → DB)
- `drizzle-kit generate` for production migrations (generates SQL files)
- `drizzle-kit migrate` for applying migrations
- Seed script with realistic test data:
  - 3 sample weddings (different stages: early planning, mid-planning, post-wedding)
  - 50-200 guests per wedding with varied RSVPs, dietary needs, travel status
  - Budget entries across all categories
  - Sample vendor records
  - Completed checklist items
- Database reset script (`pnpm db:reset` — drop, recreate, seed)

**Stack:** Drizzle ORM for schema management. Seed scripts in `packages/db/seed.ts`. Supabase CLI for local development or Docker Compose Postgres.

### 21.3 Testing Strategy

- **Unit Tests:** Vitest for all shared packages (validators, types, utility functions)
- **API Tests:** Vitest + supertest for Hono API endpoints (auth mocking, DB fixtures)
- **Component Tests:** Vitest + React Testing Library for complex UI components
- **E2E Tests:** Playwright for critical user flows:
  - Sign up → create wedding → add guests → send RSVPs
  - Purchase flow (Stripe test mode)
  - Wedding website builder → publish → view
  - Seating chart → assign guests → export
  - Guest RSVP flow (magic link → form → confirmation)
- **Visual Regression:** Playwright screenshots for wedding website templates
- **Test Database:** Separate Supabase project or Docker Postgres for test isolation
- Test commands: `pnpm test`, `pnpm test:unit`, `pnpm test:api`, `pnpm test:e2e`

**Stack:** Vitest (fast, Vite-native). Playwright for E2E (cross-browser). Stripe test mode for payment testing. Clerk test mode for auth testing. GitHub Actions runs all tests on PR.

### 21.4 Development Tools

- TypeScript strict mode with no `any` allowed
- ESLint + Prettier for consistent code style
- Husky + lint-staged for pre-commit checks (lint, type-check, format)
- Commitlint for conventional commit messages (optional)
- VS Code recommended extensions config
- Debug configurations for both apps

**Stack:** Shared ESLint and TypeScript configs in `packages/config/`. Husky hooks run on commit. Turborepo caches lint/type-check results.

### 21.5 API Testing Tools

- Bruno or Insomnia collection for all API endpoints
- Organized by feature area (guests, budget, RSVP, etc.)
- Pre-configured auth headers (Clerk test tokens)
- Example request/response for every endpoint
- Environment switching (local / dev / production)

**Stack:** API collection files committed to repo. Auth tokens configured per environment.

### 21.6 Stripe Test Mode

- All payment flows work in Stripe test mode
- Test card numbers for various scenarios:
  - Successful payment: 4242 4242 4242 4242
  - Declined: 4000 0000 0000 0002
  - 3D Secure required: 4000 0025 0000 3155
- Webhook testing via `stripe listen --forward-to localhost:3001/webhooks/stripe`
- Test clock for subscription scenarios (if ever needed)
- Cash registry contribution testing

**Stack:** Stripe CLI for local webhook forwarding. Stripe test mode keys in dev `.env`. Hono webhook handler works identically in test and production.

### 21.7 Email Testing

- Resend test mode / dev API key
- Email previews in browser during development
- React Email dev server for template development (`pnpm email:dev`)
- All emails can be previewed without sending

**Stack:** React Email dev server renders templates locally. Resend dev mode catches emails without delivering. Next.js route for email preview in development.

---

## 22. CI/CD & Deployment Pipeline

### 22.1 GitHub Actions CI

- Triggers on every pull request to `dev` and `main`
- Pipeline steps:
  1. Install dependencies (`pnpm install --frozen-lockfile`)
  2. Type check (`pnpm turbo type-check`)
  3. Lint (`pnpm turbo lint`)
  4. Unit + API tests (`pnpm turbo test`)
  5. Build all packages and apps (`pnpm turbo build`)
  6. E2E tests against preview deployment (on `main` PRs only)
- Caches pnpm store and Turborepo cache for speed
- Blocks merge if any step fails

**Stack:** GitHub Actions workflow. Turborepo remote caching (optional, via Vercel). pnpm for deterministic installs.

### 22.2 Preview / Staging Deployments

- **Vercel Preview:** Every PR automatically gets a preview URL (unique per PR)
  - e.g., `planfortwo-abc123.vercel.app`
  - Connected to dev Supabase project
  - Uses Stripe test mode
  - Uses Clerk dev instance
  - Team can review live before merging
- **Railway Preview (optional):** API preview deployments per PR
  - Or single `dev` environment that deploys from `dev` branch
- **Preview environment variables:** Separate from production
  - Dev Supabase URL
  - Stripe test keys
  - Clerk dev keys
  - Resend dev key (emails don't actually send)

**Stack:** Vercel auto-deploys preview for frontend. Railway deploys dev API from `dev` branch. Separate Supabase project for dev/staging. All services have dev-mode configurations.

### 22.3 Production Deployment

- **Frontend (Vercel):** Auto-deploys when `main` branch is updated
  - Production URL: `app.planfortwo.com`
  - Environment variables scoped to Production
  - Edge network for global performance
  - Automatic rollback if deploy fails
- **Backend (Railway):** Auto-deploys when `main` branch is updated
  - Production URL: `api.planfortwo.com`
  - Health check endpoint for monitoring
  - Zero-downtime deploys
  - Automatic restart on crash
- **Database (Supabase):** Production project
  - Migrations applied manually or via CI step
  - Connection pooling enabled (PgBouncer)
  - Automated backups
  - Point-in-time recovery
- **DNS (Cloudflare):**
  - `app.planfortwo.com` → CNAME to Vercel
  - `api.planfortwo.com` → CNAME to Railway
  - `*.planfortwo.com` → wildcard for wedding websites
  - SSL/TLS in Full (strict) mode
  - Caching rules for static assets
  - DDoS protection active

**Stack:** Vercel production deployment. Railway production service. Supabase production project. Cloudflare DNS with proxy enabled. Stripe live mode keys. Clerk production instance. Resend verified domain.

### 22.4 Git Workflow

```
main (production) ← only merged via PR, auto-deploys to prod
  │
  └── dev (staging) ← auto-deploys to preview/staging
        │
        ├── feature/jaden/guest-list
        └── feature/friend/seating-chart
```

- Nobody pushes directly to `main` or `dev`
- All work on feature branches
- Feature → dev via PR (peer review)
- dev → main via PR (both approve)
- Branch protection rules enforced on GitHub

**Stack:** GitHub branch protection. GitHub Actions CI gates. Vercel + Railway auto-deploy on merge.

### 22.5 Environment Matrix

| Service         | Local Dev                        | Preview/Staging           | Production                |
| --------------- | -------------------------------- | ------------------------- | ------------------------- |
| Frontend        | localhost:3000                   | PR-specific.vercel.app    | app.planfortwo.com        |
| Backend API     | localhost:3001                   | api-dev.planfortwo.com    | api.planfortwo.com        |
| Database        | Docker Postgres / Supabase local | Supabase dev project      | Supabase prod project     |
| Auth            | Clerk dev instance               | Clerk dev instance        | Clerk prod instance       |
| Payments        | Stripe test mode                 | Stripe test mode          | Stripe live mode          |
| Email           | React Email preview / Resend dev | Resend dev (no send)      | Resend production         |
| File Storage    | Local filesystem / R2 dev        | Cloudflare R2 dev bucket  | Cloudflare R2 prod bucket |
| Background Jobs | Inngest dev server               | Inngest dev environment   | Inngest production        |
| DNS             | localhost                        | Cloudflare dev subdomains | Cloudflare production     |

### 22.6 Monitoring & Observability (Production)

- Error tracking: Sentry (frontend + backend)
- Uptime monitoring: BetterUptime or Railway built-in
- API response time tracking
- Database query performance (Supabase dashboard)
- Stripe webhook delivery monitoring
- Email delivery rates (Resend dashboard)
- Cloudflare analytics (traffic, cache hit rate, threats blocked)

**Stack:** Sentry SDK in Next.js and Hono. Railway metrics dashboard. Supabase performance advisor. Cloudflare analytics.

---

## 23. Missing Feature Gap Analysis — Additional Features

### 23.1 Onboarding Flow

- Step-by-step wizard after sign-up:
  1. Partner names
  2. Wedding date (known or estimated)
  3. Expected guest count
  4. Total budget (or "not sure yet")
  5. Wedding style preference (quiz or skip)
  6. Planning timeline template selection
- Invite partner to join
- Suggested first steps based on how far out the wedding is

**Stack:** Next.js multi-step form wizard. Supabase stores onboarding data on wedding record. Hono API processes setup. Clerk creates the couple relationship.

### 23.2 Landing Page / Marketing Site

- Public-facing homepage at `planfortwo.com`
- Features overview, pricing, testimonials
- Demo wedding website (interactive preview)
- Blog / wedding tips content (SEO play)
- "Get Started Free" CTA
- Social proof counters ("10,000 weddings planned")

**Stack:** Next.js static pages (ISR for blog). Vercel hosts everything. Cloudflare caches static content. Separate from the app routes (`/` vs `/dashboard`).

### 23.3 Referral Program

- Every couple gets a referral link
- Refer a friend who purchases → both get a bonus (e.g., extra templates, stationery credit)
- Track referrals in dashboard
- Referral leaderboard (optional gamification)

**Stack:** Supabase referrals table (referrer_id, referred_id, status, reward_given). Hono API tracks referral code usage at purchase. Stripe metadata tags referral source. Next.js referral page in dashboard.

### 23.4 Accessibility (a11y)

- WCAG 2.1 AA compliance across all pages
- Keyboard navigation for all features
- Screen reader support
- Color contrast compliance
- Focus indicators
- Alt text for all images
- ARIA labels on interactive elements
- Accessible wedding website templates

**Stack:** Next.js accessibility practices. Tailwind CSS focus-visible utilities. ESLint jsx-a11y plugin. Playwright accessibility testing.

### 23.5 Internationalization (Future)

- Multi-language support for the app interface
- Multi-language wedding websites (for multicultural weddings)
- Currency support for budget (USD, EUR, GBP, CAD, AUD, etc.)
- Date format preferences (MM/DD/YYYY vs DD/MM/YYYY)
- Timezone handling for events (critical for destination weddings)

**Stack:** Next.js i18n routing. Translation files in `packages/i18n/`. Supabase stores locale preferences. Hono API respects timezone headers.

### 23.6 Dark Mode

- System preference detection
- Manual toggle
- Applies to dashboard and wedding website preview
- Wedding websites use their own color scheme (not affected by dark mode)

**Stack:** Next.js + Tailwind CSS dark mode (class strategy). `next-themes` library. Preference stored in localStorage and Supabase user settings.

### 23.7 Offline Support

- View checklist, guest list, budget offline (PWA cache)
- Queue changes made offline, sync when back online
- Critical for destination weddings with spotty WiFi
- Day-of timeline viewable offline

**Stack:** Next.js service worker (PWA). Cache API for offline data. Background sync for queued mutations. IndexedDB for offline storage.

### 23.8 Music & Playlist Management

- Couple creates must-play and do-not-play lists
- Guests suggest songs via RSVP or dedicated page
- Share playlist with DJ/band
- Spotify/Apple Music playlist integration (link sharing)
- First dance, parent dances, cake cutting song designations

**Stack:** Supabase songs table (title, artist, requested_by, category, status). Hono API. Next.js playlist management page. Song request field in RSVP form.

### 23.9 Weather Integration

- Weather forecast for wedding day (updates as date approaches)
- Historical weather data for venue location (outdoor wedding planning)
- Severe weather alerts
- "Plan B" reminder for outdoor weddings

**Stack:** Hono API fetches weather data from free weather API (Open-Meteo). Supabase caches forecasts. Inngest daily weather check job as wedding date approaches. Resend sends weather alert emails.

### 23.10 Honeymoon Planning Section

- Destination research notes
- Travel booking links
- Packing checklist
- Itinerary builder (day-by-day)
- Document tracker (passports, visas, travel insurance)
- Honeymoon fund progress (linked to cash registry)

**Stack:** Supabase honeymoon tables (itinerary, documents, packing_list). Hono CRUD API. Next.js honeymoon planning pages. Cloudflare R2 for document uploads.

### 23.11 Wedding Hashtag Tools

- Hashtag generator based on couple names
- Uniqueness checker (is #SmithWedding2026 already used?)
- Display hashtag on wedding website
- Social media feed aggregation (pull posts with your hashtag — future feature)

**Stack:** Hono API hashtag generation logic. Next.js hashtag tools page. Social media API integration (future, complex).

### 23.12 Ceremony Planning

- Ceremony outline builder (processional, readings, vows, ring exchange, etc.)
- Reading selection library
- Vow writing workspace (private per partner, optional reveal feature)
- Music selections for each ceremony moment
- Processional order builder (who walks when)
- Rehearsal guide generator (shareable with wedding party)

**Stack:** Supabase ceremony tables (outline, readings, vows, processional). Hono API. Next.js ceremony planning pages. Privacy controls on vows (partner can't see until chosen moment).

### 23.13 Legal & Paperwork

- Marriage license requirements by state/country
- Required documents checklist
- Blood test requirements (some states)
- Waiting period information
- Filing deadline after ceremony
- Witness requirements
- Officiant requirements (ordained, licensed, etc.)
- Name change guide (detailed, post-wedding)

**Stack:** Supabase static reference data seeded by state/country. Next.js info pages. Hono API serves location-specific requirements.

### 23.14 Emergency & Day-Of Toolkit

- Emergency kit checklist (sewing kit, stain remover, pain relievers, etc.)
- Important phone numbers list (all vendors, venue coordinator, emergency contacts)
- Timeline with real-time updates
- Quick-access vendor contacts
- Weather check
- "Something went wrong" contingency plans per scenario

**Stack:** Next.js dedicated `/emergency` route optimized for mobile. Supabase stores emergency contacts and contingency plans. Service worker caches this page for offline access.

### 23.15 Gift Registry Aggregator

- Import gift lists from external registries via URL
- Unified view of all gifts across all registries
- Track which items have been purchased (if registry provides API)
- Avoid duplicate gifts across registries

**Stack:** Hono API scrapes or uses APIs from major registries (where available). Supabase stores aggregated gift data. Next.js unified registry view. Inngest periodic sync job.

### 23.16 Wedding Party Proposal Tools

- Digital "Will you be my bridesmaid/groomsman?" cards
- Custom message and photo
- Shareable link or email delivery
- Response tracking (accepted/declined)
- Animated reveal

**Stack:** Next.js animated proposal page. Supabase proposal records. Resend delivers proposal emails. Cloudflare R2 for custom photos.

### 23.17 Rehearsal Dinner Planning

- Separate event with its own:
  - Guest list (subset of wedding guests)
  - Venue and catering
  - Budget tracking
  - Timeline
  - Toasts and speeches order

**Stack:** Uses existing multi-event system (Section 11). Supabase event record with type="rehearsal_dinner". All sub-features (guests, budget, timeline) scoped to event.

### 23.18 Print-at-Home Templates

- Welcome signs
- Table numbers
- Menu cards
- Ceremony programs
- Favor tags
- Envelope addressing template
- All matching wedding design theme
- High-res PDF download

**Stack:** Next.js template editor with live preview. Hono API PDF generation (Puppeteer HTML-to-PDF for complex layouts). Cloudflare R2 for generated files. Styled using couple's color palette from Supabase.

### 23.19 Couple's Private Journal

- Private space for thoughts, feelings, memories during planning
- Milestone entries (venue visit, dress shopping, cake tasting)
- Photo diary
- Reflection prompts
- Only visible to the couple (not shared with planners or family)

**Stack:** Supabase journal_entries table with strict RLS (couple only). Cloudflare R2 for journal photos. Hono API. Next.js journal page with rich text editor.

### 23.20 Social Sharing

- Share wedding website on social media (beautiful preview cards)
- Share countdown on Instagram stories (generated image)
- Share RSVP stats ("80% of guests confirmed!")
- "We're getting married" announcement generator

**Stack:** Next.js OG image generation for social cards. Hono API generates shareable images (canvas/sharp). Cloudflare R2 for generated assets. Open Graph tags on wedding website.

---

## Feature Count Summary (Updated)

| #   | Category                           | Features               |
| --- | ---------------------------------- | ---------------------- |
| 1   | Auth & Accounts                    | 4                      |
| 2   | Dashboard                          | 5                      |
| 3   | Planning Checklist                 | 6                      |
| 4   | Guest List                         | 9                      |
| 5   | RSVP System                        | 5                      |
| 6   | Budget Tracker                     | 8                      |
| 7   | Wedding Website                    | 7                      |
| 8   | Seating Chart                      | 5                      |
| 9   | Vendor Management                  | 5                      |
| 10  | Wedding Party                      | 5                      |
| 11  | Events & Timeline                  | 4                      |
| 12  | Guest Communication                | 3                      |
| 13  | Design & Inspiration               | 4                      |
| 14  | Stationery Suite                   | 3                      |
| 15  | Photo & Video                      | 5                      |
| 16  | Registry                           | 4                      |
| 17  | Post-Wedding                       | 6                      |
| 18  | Account & Settings                 | 6                      |
| 19  | Mobile Experience                  | 3                      |
| 20  | Admin & Internal                   | 2                      |
| 21  | Dev & Testing Environment          | 7                      |
| 22  | CI/CD & Deployment                 | 6                      |
| 23  | Additional Features (Gap Analysis) | 20                     |
|     | **TOTAL**                          | **~130 feature areas** |

---

## Stack Usage Summary

| Tool                     | Where It's Used                                                                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js / Vercel**     | All UI: dashboard, checklist, guest list, budget, website builder, seating chart, RSVP forms, admin. Wedding websites are also Next.js pages served from Vercel.                                                                                                                        |
| **Hono / Railway**       | All API endpoints: CRUD operations, aggregations, file upload handling, webhook processing, PDF/CSV generation, QR code generation, email queueing.                                                                                                                                     |
| **Supabase / Drizzle**   | All persistent data: weddings, guests, budgets, tasks, events, vendors, photos metadata, settings, analytics, audit logs. RLS for multi-tenant security. Realtime for live updates.                                                                                                     |
| **Clerk**                | All auth: couple registration (email/Google/Apple), partner invites, guest magic links, wedding party access, role-based permissions, admin access.                                                                                                                                     |
| **Stripe**               | Payments: $200 one-time purchase via Checkout, cash registry fund contributions, future vendor marketplace commissions. Webhooks for payment confirmation.                                                                                                                              |
| **Inngest**              | All background jobs: RSVP reminder sequences, payment due reminders, email batch sends, photo processing (resize/thumbnail), weekly progress emails, post-wedding review prompts, anniversary emails, data export generation, account deletion after grace period, scheduled cron jobs. |
| **Resend + React Email** | All email: RSVP confirmations, reminders, guest announcements, partner invites, payment receipts, weekly summaries, thank-you note sends, anniversary emails, support emails. Beautiful templates via React Email.                                                                      |
| **Cloudflare R2**        | All file storage: guest photos, engagement photos, mood board images, vendor contracts, receipts, QR codes, stationery PDFs, wedding website assets, data exports.                                                                                                                      |
| **Cloudflare DNS/CDN**   | Domain management: planfortwo.com routing, custom wedding website domains (CNAME), SSL, caching, DDoS protection.                                                                                                                                                                       |
| **Zod**                  | All validation: shared schemas between frontend forms and backend API endpoints. Guest data, budget entries, RSVP submissions, wedding settings.                                                                                                                                        |
| **Turborepo + pnpm**     | Build system: orchestrates builds across web app, API, and shared packages (db, types, validators, ui). Cached builds for fast iteration.                                                                                                                                               |
