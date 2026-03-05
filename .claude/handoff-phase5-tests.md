# Phase 5 Handoff — Tests

## Status: API Tests COMPLETE

Phase 5 API tests are DONE. All gates pass:

- `pnpm type-check` — 7/7 clean
- `pnpm test` — 206 tests pass (38 new)
- `pnpm build` — both apps build

## Completed API Route Tests

1. **website-photos.test.ts** — 9 tests ✅
   - Upload URL generation, photo registration, delete, reorder
   - Feature gate (free tier 403), validation errors, missing weddingId

2. **website-analytics.test.ts** — 3 tests ✅
   - Analytics summary for full tier, 403 on free tier, missing weddingId 400

3. **website-public.test.ts** — 8 tests ✅
   - Public slug fetch, 404 for missing/unpublished, password-protected limited response
   - Full site data with sections/photos, analytics tracking, guestbook entries

4. **guestbook.test.ts** — 5 tests (already existed) ✅

## Remaining: Component & E2E Tests (Optional)

### Component Tests (apps/web/)

4. **components/website/editor/template-selector.test.tsx** — Renders 10 templates, click selects
5. **components/website/editor/section-manager.test.tsx** — Renders sections, toggle visibility, edit button
6. **components/website/editor/settings-panel.test.tsx** — Subdomain check, privacy select, meta fields
7. **components/website/editor/publish-toggle.test.tsx** — Published/unpublished states, buttons

### E2E Tests (apps/web/)

8. **e2e/website.spec.ts** — Auth redirect, /website page loads, public /w/slug rendering

## Test Patterns Used

- API tests: Auth mock + service mock pattern (see budget-categories.test.ts)
- website-public.test.ts: Uses vi.hoisted() + sequential query result queue to mock direct DB calls
- Component tests: React Testing Library pattern (see page.test.tsx)
- E2E tests: Playwright patterns (see apps/web/e2e/)

## Files Created This Session (~45 new files)

### Foundation

- apps/web/components.json
- apps/web/lib/utils.ts
- apps/web/components/ui/{tabs,dialog,switch,popover,input,textarea,label,badge,skeleton,separator,select,accordion,card,button}.tsx

### Template System

- apps/web/lib/templates.ts (10 templates)
- apps/web/lib/fonts.ts (6 font pairs)
- apps/web/lib/section-icons.ts (13 section types)
- apps/web/components/website/template-context.tsx
- apps/web/components/website/template-preview.tsx

### 13 Section Components

- apps/web/components/website/sections/{hero,our-story,event-details,wedding-party,gallery,travel,things-to-do,registry,faq,rsvp,schedule,guestbook,custom}-section.tsx
- apps/web/components/website/sections/section-renderer.tsx

### Editor

- apps/web/components/website/editor/{template-selector,section-manager,settings-panel,publish-toggle}.tsx
- apps/web/app/(dashboard)/website/page.tsx

### Public Rendering

- apps/web/app/w/[slug]/{layout,page,client,password-gate}.tsx
- apps/web/components/website/public/analytics-tracker.tsx

### Analytics Dashboard

- apps/web/components/website/analytics/analytics-dashboard.tsx

### Features Page

- apps/web/app/features/page.tsx
- apps/web/components/features/{animated-section,pricing-card,faq-section}.tsx

### API Client + Hook

- apps/web/lib/api.ts (modified — added 6 new API sections)
- apps/web/hooks/use-website.ts

### Modified

- apps/web/components/dashboard/sidebar.tsx (Website nav enabled)
- apps/web/middleware.ts (+/w, /features, /rsvp public routes)
- apps/web/tailwind.config.ts (shadcn merge)
- apps/web/app/globals.css (wedding-themed CSS vars)
- apps/web/app/page.tsx (features link updated)
- apps/web/package.json (framer-motion, lucide-react, shadcn deps)
