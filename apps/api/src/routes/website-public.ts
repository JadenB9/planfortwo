import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { trackPageViewSchema, createGuestbookEntrySchema } from '@planfortwo/validators'
import { eq, and, or } from 'drizzle-orm'
import {
  db,
  websiteConfigs,
  websiteSections,
  websitePhotos,
  weddings,
  events,
} from '@planfortwo/db'
import { asc } from 'drizzle-orm'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { guestbookService } from '../services/guestbook.js'
import { createHash } from 'node:crypto'
import { z } from 'zod'

export const websitePublicRoute = new Hono()

// Build an OR condition to match by access token (if slug contains one) or by subdomain
function slugCondition(slug: string) {
  const tokenMatch = slug.match(/([0-9a-f]{32})$/)
  const token = tokenMatch?.[1]
  if (token) {
    return or(eq(websiteConfigs.accessToken, token), eq(websiteConfigs.subdomain, slug))
  }
  return eq(websiteConfigs.subdomain, slug)
}

// GET /website-public/:slug — public wedding website data (NO auth)
// Supports both access token slugs (jabby-abc123...) and plain subdomains (jabby)
websitePublicRoute.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const [config] = await db.select().from(websiteConfigs).where(slugCondition(slug))

  if (!config || !config.publishedAt) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if (config.privacyMode === 'password') {
    // Fetch wedding name for password gate UI (no sensitive data)
    const [pwWedding] = await db
      .select({ name: weddings.name })
      .from(weddings)
      .where(eq(weddings.id, config.weddingId))

    // Only return minimal data — no internal IDs
    return c.json({
      data: {
        config: {
          templateId: config.templateId,
          privacyMode: 'password',
        },
        requiresPassword: true,
        weddingName: pwWedding?.name ?? '',
      },
    })
  }

  const [wedding] = await db
    .select({ name: weddings.name, date: weddings.date })
    .from(weddings)
    .where(eq(weddings.id, config.weddingId))

  // Query the earliest event (ceremony) for a more accurate countdown
  const weddingEvents = await db
    .select({ date: events.date, startTime: events.startTime })
    .from(events)
    .where(eq(events.weddingId, config.weddingId))
    .orderBy(asc(events.sortOrder), asc(events.date))

  const ceremonyEvent = weddingEvents[0] ?? null

  const rawSections = await db
    .select()
    .from(websiteSections)
    .where(
      and(eq(websiteSections.weddingId, config.weddingId), eq(websiteSections.isVisible, true)),
    )
    .orderBy(asc(websiteSections.sortOrder))

  const sections = rawSections.map(({ weddingId: _w, ...rest }) => rest)

  const rawPhotos = await db
    .select()
    .from(websitePhotos)
    .where(eq(websitePhotos.weddingId, config.weddingId))
    .orderBy(asc(websitePhotos.sortOrder))

  const photos = rawPhotos.map(({ weddingId: _w, ...rest }) => rest)

  const headers: Record<string, string> = {}
  if (config.privacyMode === 'unlisted') {
    headers['X-Robots-Tag'] = 'noindex'
  }

  const { passwordHash: _, ...safeConfig } = config

  return c.json(
    {
      data: {
        config: {
          templateId: safeConfig.templateId,
          customColors: safeConfig.customColors,
          fontPair: safeConfig.fontPair,
          privacyMode: safeConfig.privacyMode,
          metaTitle: safeConfig.metaTitle,
          metaDescription: safeConfig.metaDescription,
          ogImageUrl: safeConfig.ogImageUrl,
          subdomain: safeConfig.subdomain,
        },
        sections,
        photos,
        weddingName: wedding?.name ?? '',
        weddingDate: wedding?.date ?? null,
        ceremonyDate: ceremonyEvent?.date ?? wedding?.date ?? null,
        ceremonyStartTime: ceremonyEvent?.startTime ?? null,
      },
    },
    200,
    headers,
  )
})

// Helper: resolve slug to config and verify site is published & not password-locked
async function resolvePublicConfig(slug: string) {
  const [config] = await db
    .select({
      weddingId: websiteConfigs.weddingId,
      privacyMode: websiteConfigs.privacyMode,
      publishedAt: websiteConfigs.publishedAt,
    })
    .from(websiteConfigs)
    .where(slugCondition(slug))

  if (!config || !config.publishedAt) return null
  return config
}

// Simple in-memory dedup cache for analytics (visitorId:path -> timestamp)
const analyticsDedup = new Map<string, number>()
const DEDUP_WINDOW_MS = 30_000
// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, ts] of analyticsDedup) {
    if (now - ts > DEDUP_WINDOW_MS * 2) analyticsDedup.delete(key)
  }
}, 60_000)

// POST /website-public/:slug/track — record analytics event (NO auth)
websitePublicRoute.post(
  '/:slug/track',
  zValidator('json', trackPageViewSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const slug = c.req.param('slug')

    const config = await resolvePublicConfig(slug)
    if (!config) {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    // Block analytics on password-protected sites (visitor hasn't authenticated)
    if (config.privacyMode === 'password') {
      return c.json({ data: { success: true } })
    }

    const data = c.req.valid('json')
    const xff = c.req.header('x-forwarded-for')
    const ip = xff
      ? (xff
          .split(',')
          .map((s) => s.trim())
          .pop() ?? 'unknown')
      : (c.req.header('x-real-ip') ?? 'unknown')
    const ua = c.req.header('user-agent') ?? ''
    const country = c.req.header('cf-ipcountry') ?? null
    const visitorId = createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16)

    // Deduplicate: skip if same visitor+path tracked within 30 seconds
    const dedupKey = `${visitorId}:${data.path}:${data.sectionViewed ?? ''}`
    const lastTracked = analyticsDedup.get(dedupKey)
    if (lastTracked && Date.now() - lastTracked < DEDUP_WINDOW_MS) {
      return c.json({ data: { success: true } })
    }
    analyticsDedup.set(dedupKey, Date.now())

    await websiteAnalyticsService.track(
      config.weddingId,
      visitorId,
      data.path,
      data.sectionViewed ?? null,
      data.referrer ?? null,
      country,
      ua || null,
    )

    return c.json({ data: { success: true } })
  },
)

// GET /website-public/:slug/guestbook — approved guestbook entries (NO auth)
websitePublicRoute.get('/:slug/guestbook', async (c) => {
  const slug = c.req.param('slug')

  const config = await resolvePublicConfig(slug)
  if (!config) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  // Block guestbook on password-protected sites
  if (config.privacyMode === 'password') {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const entries = await guestbookService.listApproved(config.weddingId)
  return c.json({ data: entries })
})

// POST /website-public/:slug/guestbook — submit guestbook entry via slug (NO auth)
// Validates input with a public-friendly schema (no weddingId from client)
const publicGuestbookSchema = z.object({
  authorName: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
  website: z.string().url().max(200).optional(),
})

websitePublicRoute.post(
  '/:slug/guestbook',
  zValidator('json', publicGuestbookSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const slug = c.req.param('slug')

    const config = await resolvePublicConfig(slug)
    if (!config) {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    // Block guestbook on password-protected sites
    if (config.privacyMode === 'password') {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    const data = c.req.valid('json')

    // Honeypot check — bots fill hidden "website" field
    if (data.website) {
      return c.json(
        {
          data: {
            id: 'ok',
            authorName: data.authorName,
            message: data.message,
            isVisible: false,
          },
        },
        201,
      )
    }

    const entry = await guestbookService.create({
      weddingId: config.weddingId,
      authorName: data.authorName,
      message: data.message,
    })
    return c.json({ data: entry }, 201)
  },
)
