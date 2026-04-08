import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
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
// ceremony route removed from UI — keeping files for potential future use
import { playlistsRoute } from './routes/playlists.js'
import { spotifyRoute } from './routes/spotify.js'
import { honeymoonRoute } from './routes/honeymoon.js'
import { weatherRoute } from './routes/weather.js'
import { progressRoute } from './routes/progress.js'
import { notificationsRoute } from './routes/notifications.js'
import { prayersRoute } from './routes/prayers.js'
import { inboxRoute } from './routes/inbox.js'
import { resendWebhookRoute } from './routes/webhooks-resend.js'
import { stripeWebhookRoute } from './routes/webhooks-stripe.js'
import { rateLimit } from './middleware/rate-limit.js'
import { inngest } from './inngest/client.js'
import { onPaymentReminder } from './inngest/functions/onPaymentReminder.js'

const app = new Hono()

// ── Global Middleware ──
app.use('*', logger())
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  }),
)

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
    origin: (origin) => {
      // Exact match for known origins
      if (allowedOrigins.includes(origin)) return origin
      // Allow any *.planfortwo.com subdomain (public wedding websites)
      // SECURITY NOTE: Subdomain origins get credentials: true, but Clerk JWTs
      // are stored only on the main app domain. Subdomains only access public endpoints.
      if (/^https:\/\/[a-z0-9-]+\.planfortwo\.com$/.test(origin)) return origin
      return undefined
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  }),
)

// ── Body Size Limits (must be registered BEFORE routes) ──
// Routes with their own explicit limits run first with their looser cap;
// the global default below is applied ONLY to paths that don't have a
// specific override, so later generic handlers don't reject requests the
// path-specific limit already approved.
app.use('/website-public/*/photos/upload', bodyLimit({ maxSize: 25 * 1024 * 1024 }))
app.use('/webhooks/*', bodyLimit({ maxSize: 5 * 1024 * 1024 }))
app.use('/events/*/map', bodyLimit({ maxSize: 10 * 1024 * 1024 }))

const PATHS_WITH_OWN_BODY_LIMIT = [
  /^\/website-public\/[^/]+\/photos\/upload/,
  /^\/webhooks\//,
  /^\/events\/[^/]+\/map(\?|$)/,
]
const defaultBodyLimit = bodyLimit({ maxSize: 1024 * 1024 }) // 1MB default
app.use('*', async (c, next) => {
  const path = c.req.path
  if (PATHS_WITH_OWN_BODY_LIMIT.some((re) => re.test(path))) return next()
  return defaultBodyLimit(c, next)
})

// ── Rate Limiting (must be registered BEFORE routes) ──
const publicRateLimit = rateLimit({ windowMs: 60_000, max: 30, prefix: 'pub' })
const strictRateLimit = rateLimit({ windowMs: 60_000, max: 10, prefix: 'strict' })
const rsvpLookupRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'rsvp-lookup' })
const rsvpSubmitRateLimit = rateLimit({ windowMs: 60_000, max: 10, prefix: 'rsvp-submit' })
const rsvpBatchRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'rsvp-batch' })
const inviteSendRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'invite-send' })
const inviteBulkRateLimit = rateLimit({ windowMs: 60_000, max: 2, prefix: 'invite-bulk' })
const photoUploadRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'photo-upload' })
app.use('/website-public/*/photos/upload', photoUploadRateLimit)
// Public write endpoints — tighter limit for submissions (5/min per IP)
const publicWriteRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'pub-write' })
app.use('/website-public/*/guestbook', publicWriteRateLimit)
app.use('/website-public/*/prayers', publicWriteRateLimit)
app.use('/website-public/*/song-requests', publicWriteRateLimit)
app.use('/website-public/*', publicRateLimit)
app.use('/guestbook/*', publicRateLimit)
app.use('/prayers/*', publicRateLimit)
// Spotify search — prevent quota exhaustion (10/min)
app.use('/rsvp/spotify-search', strictRateLimit)
// RSVP lookup: 10/min for token/guest-id lookup, 5/min for name lookup (probes PII)
app.use('/rsvp/lookup', strictRateLimit)
app.use('/rsvp/lookup-by-name', rsvpLookupRateLimit)
app.use('/rsvp/lookup-by-guest-id', strictRateLimit)
// RSVP submit: 10/min single, 5/min batch
app.use('/rsvp/submit', rsvpSubmitRateLimit)
app.use('/rsvp/submit-batch', rsvpBatchRateLimit)
app.use('/rsvp/*', publicRateLimit)
const contactRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'contact' })
app.use('/contact/*', contactRateLimit)
// Brute-force protection on password verification (5/min)
app.use('/website-config/verify-password', rsvpLookupRateLimit)
app.use('/inbox/send', strictRateLimit)
app.use('/inbox/addresses', strictRateLimit)
// Stripe checkout abuse prevention (5/min)
const checkoutRateLimit = rateLimit({ windowMs: 60_000, max: 5, prefix: 'checkout' })
app.use('/purchases/checkout', checkoutRateLimit)
// Financial and redemption endpoints (5/min)
app.use('/registry/funds/*/contribute', rsvpLookupRateLimit)
app.use('/referrals/redeem', rsvpLookupRateLimit)
// Guest invite email rate limiting
app.use('/guests/send-invites', inviteBulkRateLimit)
app.use('/guests/*/send-invite', inviteSendRateLimit)
// Invitation resend — prevent email harassment (5/min)
app.use('/weddings/*/invitations/*/resend', inviteSendRateLimit)

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
app.route('/prayers', prayersRoute)
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
// ceremony route removed
app.route('/playlists', playlistsRoute)
app.route('/spotify', spotifyRoute)
app.route('/honeymoon', honeymoonRoute)
app.route('/weather', weatherRoute)
app.route('/progress', progressRoute)
app.route('/notifications', notificationsRoute)
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
