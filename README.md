# PlanForTwo

A full-stack wedding planning platform that helps couples organize every detail of their big day — together. This repository is published as a portfolio piece by [Jaden Butler](https://github.com/JadenB9), a Computer Science and Cybersecurity student at Cedarville University. It is intended to demonstrate end-to-end application engineering — architecture, security hardening, testing discipline, and product depth — rather than to be installed or replicated by other operators.

> **Latest release:** [v1.1.0 — Security & UX Sweep](https://github.com/JadenB9/planfortwo/releases/tag/v1.1.0)
> **Test suite:** 491 tests passing across 57 files
> **`pnpm audit`:** 0 known vulnerabilities

## What It Does

PlanForTwo gives engaged couples a single workspace for every part of planning a wedding:

- **Checklist Management** — customizable task lists with templates, categories, drag-and-drop reordering, and progress tracking.
- **Guest List & RSVP** — full guest and household management, custom tags, CSV import/export, and public RSVP pages with unique tokens.
- **Budget Tracker** — category-based budgeting with expense tracking, analytics, payment splits, CSV/PDF export, and Cloudflare R2 receipt uploads.
- **Wedding Website Builder** — 10 templates, 13 section types (hero, story, events, gallery, RSVP, guestbook, prayers, song requests, registry, FAQ, and more), 6 font pairs, custom palettes, custom subdomains, password protection, QR-code generator with scan tracking, and visitor analytics.
- **Seating Chart Builder** — interactive drag-and-drop table assignments with conflict detection.
- **Vendor Management** — contact tracking, contracts, communication log, and payment schedules.
- **Event Timeline** — day-of schedule and event coordination.
- **Communication Hub** — email campaigns, in-app inbox over a `@planfortwo.com` address (powered by a Resend inbound webhook), and attachments on outbound mail.
- **Photo Gallery & Registry** — shared albums with guest uploads, registry import, cash funds, inline registry viewer.
- **Ceremony Planning** — vow workspace, processional order, ceremony outlines.
- **Music & Playlists** — playlist builder, Spotify OAuth integration, guest song requests with approval flow, accepted-songs playlist, prayers section.
- **Post-Wedding Tools** — thank-you tracker, name-change checklist, honeymoon planning.

## Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Frontend        | Next.js 15 (App Router, Server Components) |
| Backend         | Hono.js REST API                           |
| Database        | PostgreSQL via Drizzle ORM                 |
| Auth            | Clerk                                      |
| Payments        | Stripe                                     |
| Email           | Resend + React Email (inbound + outbound)  |
| Storage         | Cloudflare R2                              |
| Background Jobs | Inngest                                    |
| Validation      | Zod (shared between frontend and backend)  |
| Monorepo        | Turborepo + pnpm                           |
| Testing         | Vitest (491 tests) + Playwright            |
| Hosting         | Vercel (web) + Railway (api)               |

## What I Wanted to Demonstrate

This project exists to show several things at once:

1. **Production-grade architecture.** A real monorepo with shared types and validators, a service-layer API, server-rendered frontend, and a feature-gated tier system tied to Stripe billing.
2. **Security taken seriously.** Multiple security sweeps with documented findings: comprehensive XSS hardening via DOMPurify, IDOR fixes across 26 wedding-scoped routes, full Zod validation at every API boundary, rate limiting, CORS lockdown, strict CSP, cascading deletes for orphan PII, `pnpm audit` wired into CI as a blocking check. Patched a high-severity SQL injection advisory in Drizzle (GHSA-gpj5-g38j-94v9) before it could ship to production. See [`SECURITY.md`](./SECURITY.md) for the full posture and how to report a vulnerability.
3. **Discipline around quality gates.** Type-check, lint, format, test, and audit all run in CI. The build doesn't ship if any of them fail.
4. **Test-driven development at scale.** 491 tests across 57 files, including unit tests for services, route handler tests for every API endpoint, and Playwright end-to-end coverage of the critical user flows.
5. **Real product judgment.** Feature work that actually solves the problem couples have when planning a wedding — not generic CRUD demos. 13 dashboards, 13 website section types, dark mode, multi-wedding switching, public couple search, and 100+ commits of UX polish since v1.0.0.

## Architecture at a Glance

```
Browser
  → Vercel (Next.js 15, RSC + SSR)
    → fetch
      → Railway (Hono.js)
        → Clerk JWT middleware
          → Zod validation (shared schemas from packages/validators)
            → Service layer (apps/api/src/services/)
              → Drizzle ORM
                → Supabase Postgres
```

Every authenticated route runs through `authMiddleware → resolveUserMiddleware → resolveWeddingMiddleware → requireFeature(...)`. Route handlers stay thin and delegate to a service-layer module that owns all business logic and database access.

## Project Structure

```
apps/
  web/          — Next.js 15 App Router frontend
  api/          — Hono.js REST API
packages/
  db/           — Drizzle schemas, client, migrations (37 tables)
  types/        — Shared TypeScript types
  validators/   — Shared Zod schemas
  email/        — React Email templates
  config/       — Shared ESLint, TypeScript, Tailwind configs
  storage/      — Cloudflare R2 utilities
  mcp/          — Model Context Protocol server for AI agents
workers/
  subdomain-proxy/  — Cloudflare Worker that routes wedding-website subdomains
```

## Status

| Phase | Name                    | Status  |
| ----- | ----------------------- | ------- |
| 0     | Foundation              | Done    |
| 1     | Auth & Onboarding       | Done    |
| 2     | Dashboard & Checklist   | Done    |
| 3     | Guest List & RSVP       | Done    |
| 4     | Budget Tracker          | Done    |
| 5     | Wedding Website Builder | Done    |
| 6+    | See releases            | Ongoing |

Check the [releases page](https://github.com/JadenB9/planfortwo/releases) for the full changelog.

## License

Licensed under the [GNU Affero General Public License v3.0](./LICENSE). You're welcome to read, study, and learn from this code. If you redistribute or run a modified version as a network service, the AGPL requires that you also publish your changes under the same license.

This project depends on several third-party services (Clerk, Stripe, Supabase, Resend, Cloudflare, Inngest, Vercel, Railway), each with its own license and terms.

## Security

If you find a security issue, please **do not open a public issue.** See [`SECURITY.md`](./SECURITY.md) for the disclosure process.

## Contact

Jaden Butler — Cedarville University, Computer Science & Cybersecurity
[github.com/JadenB9](https://github.com/JadenB9)
