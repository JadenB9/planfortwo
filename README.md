# PlanForTwo

A modern wedding planning platform that helps couples organize every detail of their big day — together.

## Features

- **Checklist Management** — Customizable task lists with templates, categories, drag-and-drop reordering, and progress tracking
- **Guest List & RSVP** — Full guest and household management, tagging, CSV import/export, and public RSVP pages with unique tokens
- **Budget Tracker** — Category-based budgeting with expense tracking, analytics, payment splits, CSV/PDF export, and receipt uploads
- **Wedding Website Builder** — 10 beautiful templates, 13 section types (hero, story, events, gallery, RSVP, guestbook, and more), custom subdomains, password protection, and visitor analytics
- **Seating Charts** — Interactive drag-and-drop table assignments
- **Vendor Management** — Contact tracking, contracts, and payment schedules
- **Event Timeline** — Day-of schedule and event coordination
- **Communication Hub** — Email campaigns and guest messaging
- **Photo Gallery** — Shared albums with guest uploads
- **Gift Registry** — Registry links and tracking
- **Ceremony Planning** — Vow workspace, processional order, ceremony outlines
- **Music & Playlists** — Playlist builder with guest song requests
- **Post-Wedding Tools** — Thank-you tracker, name change checklist, honeymoon planning

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: Hono.js REST API
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Clerk
- **Payments**: Stripe
- **Email**: Resend + React Email
- **Storage**: Cloudflare R2
- **Background Jobs**: Inngest
- **Validation**: Zod (shared between frontend and backend)
- **Monorepo**: Turborepo + pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

1. Clone the repository
2. Copy environment files:
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```
3. Fill in your environment variables (see `.env.example` for required keys)
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Push the database schema:
   ```bash
   pnpm db:push
   ```
6. Start development:
   ```bash
   pnpm dev
   ```

The web app runs on `http://localhost:3000` and the API on `http://localhost:3001`.

## Development

```bash
pnpm dev          # Start both apps
pnpm build        # Build everything
pnpm test         # Run all tests
pnpm type-check   # TypeScript checks
pnpm lint         # Lint all packages
pnpm format       # Format all files
```

## Project Structure

```
apps/
  web/          — Next.js frontend
  api/          — Hono.js backend API
packages/
  db/           — Database schemas and migrations
  types/        — Shared TypeScript types
  validators/   — Shared Zod validation schemas
  email/        — Email templates
  config/       — Shared configuration
  storage/      — File storage utilities
```

## License

Private — All rights reserved.
