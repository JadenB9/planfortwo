import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { trackPageViewSchema } from '@planfortwo/validators'
import { eq, and, or } from 'drizzle-orm'
import {
  db,
  websiteConfigs,
  websiteSections,
  websitePhotos,
  weddings,
  events,
  photos,
} from '@planfortwo/db'
import { asc } from 'drizzle-orm'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { guestbookService } from '../services/guestbook.js'
import { playlistService } from '../services/playlists.js'
import { storageClient } from '@planfortwo/storage'
import { createHash, randomUUID } from 'node:crypto'
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
websitePublicRoute.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const [config] = await db.select().from(websiteConfigs).where(slugCondition(slug))

  if (!config || !config.publishedAt) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if (config.privacyMode === 'password') {
    const [pwWedding] = await db
      .select({ name: weddings.name })
      .from(weddings)
      .where(eq(weddings.id, config.weddingId))

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

  const websitePhotoList = rawPhotos.map(({ weddingId: _w, ...rest }) => rest)

  // Fetch approved guest photos from the photos (gallery) table
  const approvedGuestPhotos = await db
    .select()
    .from(photos)
    .where(
      and(eq(photos.weddingId, config.weddingId), eq(photos.moderationStatus, 'approved')),
    )
    .orderBy(asc(photos.createdAt))

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
        photos: websitePhotoList,
        guestPhotos: approvedGuestPhotos.map(({ weddingId: _w, ...rest }) => rest),
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

  if (config.privacyMode === 'password') {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const entries = await guestbookService.listApproved(config.weddingId)
  return c.json({ data: entries })
})

// POST /website-public/:slug/guestbook — submit guestbook entry via slug (NO auth)
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

// --- Song Requests ---

// GET /website-public/:slug/song-requests — approved song requests (NO auth)
websitePublicRoute.get('/:slug/song-requests', async (c) => {
  const slug = c.req.param('slug')

  const config = await resolvePublicConfig(slug)
  if (!config) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if (config.privacyMode === 'password') {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const allRequests = await playlistService.listSongRequests(config.weddingId)
  const approved = allRequests.filter((r) => r.isApproved)
  return c.json({ data: approved })
})

// POST /website-public/:slug/song-requests — submit song request via slug (NO auth)
const publicSongRequestSchema = z.object({
  guestName: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(300),
  artist: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(500).nullable().optional(),
})

websitePublicRoute.post(
  '/:slug/song-requests',
  zValidator('json', publicSongRequestSchema, (result, c) => {
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

    if (config.privacyMode === 'password') {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    const data = c.req.valid('json')

    const request = await playlistService.createSongRequest({
      weddingId: config.weddingId,
      guestName: data.guestName,
      title: data.title,
      artist: data.artist,
      notes: data.notes ?? null,
    })
    return c.json({ data: request }, 201)
  },
)

// --- Guest Photo Upload ---

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

const requestGuestUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  uploaderName: z.string().trim().min(1).max(100),
})

// POST /website-public/:slug/photos/upload-url — get presigned R2 upload URL (NO auth)
websitePublicRoute.post(
  '/:slug/photos/upload-url',
  zValidator('json', requestGuestUploadSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const slug = c.req.param('slug')

    const config = await resolvePublicConfig(slug)
    if (!config) {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    if (config.privacyMode === 'password') {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    const { fileName, mimeType } = c.req.valid('json')

    const photoId = randomUUID()
    const r2Key = storageClient.buildGalleryPhotoKey(config.weddingId, photoId, fileName)
    const uploadUrl = await storageClient.getUploadUrl(r2Key, mimeType)
    const publicUrl = await storageClient.getDownloadUrl(r2Key)

    return c.json({
      data: { uploadUrl, r2Key, url: publicUrl, photoId },
    })
  },
)

const createGuestPhotoSchema = z.object({
  r2Key: z.string().trim().min(1),
  url: z.string().url(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  uploaderName: z.string().trim().min(1).max(100),
  uploaderEmail: z.string().email().max(255).optional(),
})

// POST /website-public/:slug/photos — register uploaded guest photo (NO auth)
websitePublicRoute.post(
  '/:slug/photos',
  zValidator('json', createGuestPhotoSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const slug = c.req.param('slug')

    const config = await resolvePublicConfig(slug)
    if (!config) {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    if (config.privacyMode === 'password') {
      return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }

    const data = c.req.valid('json')

    // Validate R2 key ownership — must belong to this wedding
    if (!data.r2Key.startsWith(`gallery/${config.weddingId}/`)) {
      return c.json(
        { error: 'Invalid storage key', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }

    // Reject path traversal
    if (data.r2Key.includes('..') || data.r2Key.includes('//')) {
      return c.json(
        { error: 'Invalid storage key', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }

    const [photo] = await db
      .insert(photos)
      .values({
        weddingId: config.weddingId,
        r2Key: data.r2Key,
        url: data.url,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        uploaderName: data.uploaderName,
        uploaderEmail: data.uploaderEmail ?? null,
        source: 'guest',
        moderationStatus: 'pending',
      })
      .returning()

    return c.json({ data: photo }, 201)
  },
)
