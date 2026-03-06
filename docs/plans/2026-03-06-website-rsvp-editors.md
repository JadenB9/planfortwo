# Website RSVP Integration + Section Editors Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix unpublished website bug, add Knot-style RSVP lookup on public website, and add section editors for all section types.

**Architecture:** Backend API enhancements for RSVP name lookup flow + new inline RSVP form on public website + 11 section editor modals in dashboard. Reuses existing RsvpForm component and submit endpoints.

**Tech Stack:** Next.js 15, Hono, Drizzle, shadcn/ui Dialog, framer-motion

---

## Wave 1: Backend + Foundation (parallel)

### Task 1: Fix Unpublished Website Bug

- **File:** `apps/web/app/w/[slug]/page.tsx:68`
- Change `next: { revalidate: 60 }` to `cache: 'no-store'`
- Ensures unpublished sites return 404 immediately (no stale ISR cache)

### Task 2: RSVP API Enhancements

- **Files:**
  - `apps/api/src/routes/rsvp.ts` — enhance lookup-by-name, add lookup-by-guest-id endpoint
  - `apps/api/src/services/rsvp.ts` — add lookupByGuestId method, modify lookupByName to return full RsvpLookupResult for single match
  - `packages/validators/src/index.ts` — add rsvpGuestIdLookupSchema

**Flow:**

1. Guest enters name on website → `POST /rsvp/lookup-by-name`
2. Single match → return full `RsvpLookupResult` (including rsvpToken for form submission)
3. Multiple matches → return stripped guest list for selection
4. After selection → `POST /rsvp/lookup-by-guest-id` → return full `RsvpLookupResult`
5. Submit via existing `POST /rsvp/submit` (uses rsvpToken from result)

### Task 3: SectionEditorModal Component

- **File:** `apps/web/components/website/editor/section-editor-modal.tsx` (new)
- Reusable modal wrapper using shadcn Dialog
- Props: section, open, onClose, onSave, children (form content)
- Handles API call to PUT /website-sections/:id, loading/error states

## Wave 2: RSVP Section + Editors (parallel)

### Task 4: Rewrite RSVP Section (Public Website)

- **File:** `apps/web/components/website/sections/rsvp-section.tsx` (rewrite)
- **File:** `apps/web/components/website/sections/section-renderer.tsx` — pass weddingId to RsvpSection
- **File:** `apps/web/components/rsvp/rsvp-form.tsx` — add showMealChoice/showDietary/showSongRequest optional props
- States: search → found/multiple/notfound → form → success
- Reuses existing RsvpForm component with section content settings

### Tasks 5-15: Section Editors (11 editors, no FAQ or Things To Do)

All new files in `apps/web/components/website/editor/`:

- `hero-editor.tsx` — headline, subheadline, show countdown, background image
- `our-story-editor.tsx` — narrative, timeline events (add/remove/edit date+description)
- `event-details-editor.tsx` — events array (name, date, time, venue, address, description)
- `wedding-party-editor.tsx` — members array (name, role, description, photo)
- `gallery-editor.tsx` — layout select (grid/masonry/slideshow), columns count
- `travel-editor.tsx` — accommodations array, directions, map embed URL
- `registry-editor.tsx` — registry links array (store, URL, logo)
- `rsvp-editor.tsx` — message text, toggles for meal/dietary/song
- `schedule-editor.tsx` — timeline events (time, title, description, location)
- `guestbook-editor.tsx` — welcome message, require approval toggle
- `custom-editor.tsx` — title, HTML content

## Wave 3: Integration

### Task 16: Wire Editors into Dashboard

- **File:** `apps/web/app/(dashboard)/website/page.tsx`
- Replace "coming in next iteration" placeholder with section-type switch → render correct editor
- Import all 11 editors

## Wave 4: Quality + Push

### Task 17: Test + Format + Push

- `pnpm type-check && pnpm test && pnpm format && git push`
