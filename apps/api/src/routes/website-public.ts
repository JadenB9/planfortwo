import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { trackPageViewSchema } from '@planfortwo/validators'
import { eq, and, or } from 'drizzle-orm'
import { db, websiteConfigs, websiteSections, websitePhotos, weddings } from '@planfortwo/db'
import { asc } from 'drizzle-orm'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { guestbookService } from '../services/guestbook.js'
import { createHash } from 'node:crypto'

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
    return c.json({
      data: {
        id: config.id,
        templateId: config.templateId,
        privacyMode: 'password',
        requiresPassword: true,
      },
    })
  }

  const [wedding] = await db
    .select({ name: weddings.name, date: weddings.date })
    .from(weddings)
    .where(eq(weddings.id, config.weddingId))

  const rawSections = await db
    .select()
    .from(websiteSections)
    .where(
      and(eq(websiteSections.weddingId, config.weddingId), eq(websiteSections.isVisible, true)),
    )
    .orderBy(asc(websiteSections.sortOrder))

  const sections = rawSections.map(({ weddingId: _w, ...rest }) => rest)

  const photos = await db
    .select()
    .from(websitePhotos)
    .where(eq(websitePhotos.weddingId, config.weddingId))
    .orderBy(asc(websitePhotos.sortOrder))

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
      },
    },
    200,
    headers,
  )
})

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

    const [config] = await db
      .select({ weddingId: websiteConfigs.weddingId })
      .from(websiteConfigs)
      .where(slugCondition(slug))

    if (!config) {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
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

  const [config] = await db
    .select({ weddingId: websiteConfigs.weddingId })
    .from(websiteConfigs)
    .where(slugCondition(slug))

  if (!config) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const entries = await guestbookService.listApproved(config.weddingId)
  return c.json({ data: entries })
})
