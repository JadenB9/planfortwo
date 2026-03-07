import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { serve as inngestServe } from 'inngest/hono'

import { healthRoute } from './routes/health.js'
import { usersRoute } from './routes/users.js'
import { weddingsRoute } from './routes/weddings.js'
import { tasksRoute } from './routes/tasks.js'
import { categoriesRoute } from './routes/categories.js'
import { dashboardRoute } from './routes/dashboard.js'
import { activityRoute } from './routes/activity.js'
import { featuresRoute } from './routes/features.js'
import { rsvpRoute } from './routes/rsvp.js'
import { guestsRoute } from './routes/guests.js'
import { householdsRoute } from './routes/households.js'
import { guestTagsRoute } from './routes/guest-tags.js'
import { budgetCategoriesRoute } from './routes/budget-categories.js'
import { budgetItemsRoute } from './routes/budget-items.js'
import { paymentScheduleRoute } from './routes/payment-schedule.js'
import { budgetAnalyticsRoute } from './routes/budget-analytics.js'
import { websiteConfigRoute } from './routes/website-config.js'
import { websiteSectionsRoute } from './routes/website-sections.js'
import { websitePhotosRoute } from './routes/website-photos.js'
import { websitePublicRoute } from './routes/website-public.js'
import { websiteAnalyticsRoute as websiteAnalyticsRouteHandler } from './routes/website-analytics.js'
import { guestbookRoute } from './routes/guestbook.js'
import { seatingChartsRoute } from './routes/seating-charts.js'
import { emailCampaignsRoute, announcementsRoute } from './routes/email-campaigns.js'
import { vendorsRoute } from './routes/vendors.js'
import { weddingPartyRoute } from './routes/wedding-party.js'
import { eventsRoute } from './routes/events.js'
import { photoGalleryRoute } from './routes/photo-gallery.js'
import { registryRoute } from './routes/registry.js'
import {
  thankYouRoute,
  nameChangeRoute,
  vendorReviewsRoute,
  notificationPrefsRoute,
} from './routes/post-wedding.js'
import { purchasesRoute, referralsRoute, contactRoute } from './routes/payments.js'
import { ceremonyRoute } from './routes/ceremony.js'
import { playlistsRoute } from './routes/playlists.js'
import { honeymoonRoute } from './routes/honeymoon.js'
import { weatherRoute } from './routes/weather.js'
import { progressRoute } from './routes/progress.js'
import { inboxRoute } from './routes/inbox.js'
import { resendWebhookRoute } from './routes/webhooks-resend.js'
import { stripeWebhookRoute } from './routes/webhooks-stripe.js'
import { rateLimit } from './middleware/rate-limit.js'
import { inngest } from './inngest/client.js'
import { onPaymentReminder } from './inngest/functions/onPaymentReminder.js'

const app = new Hono()

// ── Global Middleware ──
app.use('*', logger())
app.use('*', secureHeaders())

const appUrl = process.env.NEXT_PUBLIC_APP_URL
const allowedOrigins = [
  appUrl,
  // Also allow the root domain (planfortwo.com from app.planfortwo.com)
  appUrl ? appUrl.replace('://app.', '://') : undefined,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : []),
].filter(Boolean) as string[]

app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : undefined),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ── Rate Limiting (must be registered BEFORE routes) ──
const publicRateLimit = rateLimit({ windowMs: 60_000, max: 30, prefix: 'pub' })
const strictRateLimit = rateLimit({ windowMs: 60_000, max: 10, prefix: 'strict' })
app.use('/website-public/*', publicRateLimit)
app.use('/guestbook/*', publicRateLimit)
const rsvpLookupRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'rsvp-lookup' })
app.use('/rsvp/lookup-by-name', rsvpLookupRateLimit)
app.use('/rsvp/lookup-by-guest-id', rsvpLookupRateLimit)
app.use('/rsvp/*', publicRateLimit)
app.use('/contact/*', publicRateLimit)
app.use('/website-config/verify-password', strictRateLimit)
app.use('/inbox/send', strictRateLimit)
app.use('/inbox/addresses', strictRateLimit)
app.use('/registry/funds/*/contribute', publicRateLimit)

// ── Routes ──
app.route('/health', healthRoute)
app.route('/users', usersRoute)
app.route('/weddings', weddingsRoute)
app.route('/tasks', tasksRoute)
app.route('/categories', categoriesRoute)
app.route('/dashboard', dashboardRoute)
app.route('/activity', activityRoute)
app.route('/features', featuresRoute)
app.route('/rsvp', rsvpRoute)
app.route('/guests', guestsRoute)
app.route('/households', householdsRoute)
app.route('/guest-tags', guestTagsRoute)
app.route('/budget-categories', budgetCategoriesRoute)
app.route('/budget-items', budgetItemsRoute)
app.route('/payment-schedule', paymentScheduleRoute)
app.route('/budget', budgetAnalyticsRoute)
app.route('/website-config', websiteConfigRoute)
app.route('/website-sections', websiteSectionsRoute)
app.route('/website-photos', websitePhotosRoute)
app.route('/website-public', websitePublicRoute)
app.route('/website-analytics', websiteAnalyticsRouteHandler)
app.route('/guestbook', guestbookRoute)
app.route('/seating-charts', seatingChartsRoute)
app.route('/email-campaigns', emailCampaignsRoute)
app.route('/announcements', announcementsRoute)
app.route('/vendors', vendorsRoute)
app.route('/wedding-party', weddingPartyRoute)
app.route('/events', eventsRoute)
app.route('/photos', photoGalleryRoute)
app.route('/registry', registryRoute)
app.route('/thank-you', thankYouRoute)
app.route('/name-change', nameChangeRoute)
app.route('/vendor-reviews', vendorReviewsRoute)
app.route('/notification-prefs', notificationPrefsRoute)
app.route('/purchases', purchasesRoute)
app.route('/referrals', referralsRoute)
app.route('/contact', contactRoute)
app.route('/ceremony', ceremonyRoute)
app.route('/playlists', playlistsRoute)
app.route('/honeymoon', honeymoonRoute)
app.route('/weather', weatherRoute)
app.route('/progress', progressRoute)
app.route('/inbox', inboxRoute)

// ── Webhooks ──
const webhookRateLimit = rateLimit({ windowMs: 60_000, max: 100, prefix: 'webhook' })
app.use('/webhooks/*', webhookRateLimit)
app.route('/webhooks/resend', resendWebhookRoute)
app.route('/webhooks/stripe', stripeWebhookRoute)

// ── Inngest ──
app.on(
  ['GET', 'PUT', 'POST'],
  '/api/inngest',
  inngestServe({
    client: inngest,
    functions: [onPaymentReminder],
  }),
)

// ── 404 Handler ──
app.notFound((c) => {
  return c.json({ error: 'Not Found', code: 'NOT_FOUND', statusCode: 404 }, 404)
})

// ── Error Handler ──
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR', statusCode: 500 }, 500)
})

// ── Server ──
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

if (!isTest) {
  const port = Number(process.env.PORT ?? 3001)

  serve({ fetch: app.fetch, port }, (info) => {
    console.warn(`API server running on http://localhost:${info.port}`)
  })
}

export type AppType = typeof app
export default app
