import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { trackPageViewSchema } from '@planfortwo/validators'
import { eq, and } from 'drizzle-orm'
import { db, websiteConfigs, websiteSections, websitePhotos, weddings } from '@planfortwo/db'
import { asc } from 'drizzle-orm'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { guestbookService } from '../services/guestbook.js'
import { createHash } from 'node:crypto'

export const websitePublicRoute = new Hono()

// GET /website-public/:slug — public wedding website data (NO auth)
websitePublicRoute.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const [config] = await db.select().from(websiteConfigs).where(eq(websiteConfigs.subdomain, slug))

  if (!config || !config.publishedAt) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if (config.privacyMode === 'password') {
    // Return limited info — frontend must verify password first
    return c.json({
      data: {
        id: config.id,
        weddingId: config.weddingId,
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

  const sections = await db
    .select()
    .from(websiteSections)
    .where(
      and(eq(websiteSections.weddingId, config.weddingId), eq(websiteSections.isVisible, true)),
    )
    .orderBy(asc(websiteSections.sortOrder))

  const photos = await db
    .select()
    .from(websitePhotos)
    .where(eq(websitePhotos.weddingId, config.weddingId))
    .orderBy(asc(websitePhotos.sortOrder))

  const headers: Record<string, string> = {}
  if (config.privacyMode === 'unlisted') {
    headers['X-Robots-Tag'] = 'noindex'
  }

  return c.json(
    {
      data: {
        ...config,
        passwordHash: undefined,
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
      .where(eq(websiteConfigs.subdomain, slug))

    if (!config) {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    const data = c.req.valid('json')
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
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
    .where(eq(websiteConfigs.subdomain, slug))

  if (!config) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const entries = await guestbookService.listApproved(config.weddingId)
  return c.json({ data: entries })
})
