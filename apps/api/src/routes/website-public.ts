import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { trackPageViewSchema } from '@planfortwo/validators'
import { eq, and, or, isNotNull, asc, inArray } from 'drizzle-orm'
import {
  db,
  websiteConfigs,
  websiteSections,
  websitePhotos,
  weddings,
  weddingMembers,
  users,
  events,
  photos,
} from '@planfortwo/db'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { guestbookService } from '../services/guestbook.js'
import { prayersService } from '../services/prayers.js'
import { playlistService } from '../services/playlists.js'
import { storageClient } from '@planfortwo/storage'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { rateLimit } from '../middleware/rate-limit.js'

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

// GET /website-public/search?q=name — public couple name search (NO auth, rate-limited)
// Returns results ONLY when the query contains BOTH partner first names (case-insensitive).
// Display format: "FirstName and FirstName" (derived from owner + partner members).
websitePublicRoute.get(
  '/search',
  rateLimit({ windowMs: 60_000, max: 15, prefix: 'public-search' }),
  async (c) => {
    const query = c.req.query('q')?.trim() ?? ''

    if (query.length < 2) {
      return c.json({ data: [] })
    }

    const queryLower = query.toLowerCase()

    // Get all public published weddings with owner/partner first names
    const rows = await db
      .select({
        weddingId: weddings.id,
        slug: websiteConfigs.subdomain,
        date: weddings.date,
        firstName: users.firstName,
        role: weddingMembers.role,
      })
      .from(weddings)
      .innerJoin(websiteConfigs, eq(websiteConfigs.weddingId, weddings.id))
      .innerJoin(
        weddingMembers,
        and(
          eq(weddingMembers.weddingId, weddings.id),
          inArray(weddingMembers.role, ['owner', 'partner']),
        ),
      )
      .innerJoin(users, eq(users.id, weddingMembers.userId))
      .where(and(eq(websiteConfigs.privacyMode, 'public'), isNotNull(websiteConfigs.publishedAt)))
      .limit(200)

    // Group by wedding to collect owner + partner first names
    const weddingMap = new Map<
      string,
      { slug: string | null; date: Date | null; ownerName: string; partnerName: string }
    >()
    for (const row of rows) {
      const existing = weddingMap.get(row.weddingId)
      if (!existing) {
        weddingMap.set(row.weddingId, {
          slug: row.slug,
          date: row.date,
          ownerName: row.role === 'owner' ? row.firstName : '',
          partnerName: row.role === 'partner' ? row.firstName : '',
        })
      } else {
        if (row.role === 'owner' && !existing.ownerName) existing.ownerName = row.firstName
        if (row.role === 'partner' && !existing.partnerName) existing.partnerName = row.firstName
      }
    }

    // Only return matches where query contains BOTH first names (case-insensitive).
    // When both names are the same, require the name to appear at least twice.
    const matches = Array.from(weddingMap.values())
      .filter((w) => {
        if (!w.slug || !w.ownerName || !w.partnerName) return false
        const ownerLower = w.ownerName.toLowerCase()
        const partnerLower = w.partnerName.toLowerCase()
        if (ownerLower === partnerLower) {
          // Same name: require it appears twice (e.g. "jaden and jaden")
          const firstIdx = queryLower.indexOf(ownerLower)
          if (firstIdx === -1) return false
          const secondIdx = queryLower.indexOf(ownerLower, firstIdx + ownerLower.length)
          return secondIdx !== -1
        }
        return queryLower.includes(ownerLower) && queryLower.includes(partnerLower)
      })
      .slice(0, 10)
      .map((w) => ({
        name: `${w.ownerName} and ${w.partnerName}`,
        slug: w.slug,
        date: w.date,
      }))

    return c.json({ data: matches })
  },
)

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
    .where(and(eq(photos.weddingId, config.weddingId), eq(photos.moderationStatus, 'approved')))
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
    const realIp = c.req.header('x-real-ip')
    const xff = c.req.header('x-forwarded-for')
    const ip = realIp ? realIp : xff ? (xff.split(',')[0]?.trim() ?? 'unknown') : 'unknown'
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

// --- Prayers ---

// GET /website-public/:slug/prayers — approved prayers (NO auth)
websitePublicRoute.get('/:slug/prayers', async (c) => {
  const slug = c.req.param('slug')

  const config = await resolvePublicConfig(slug)
  if (!config) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if (config.privacyMode === 'password') {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const entries = await prayersService.listApproved(config.weddingId)
  return c.json({ data: entries })
})

// POST /website-public/:slug/prayers — submit prayer via slug (NO auth)
const publicPrayerSchema = z.object({
  authorName: z.string().trim().min(1).max(100),
  prayerText: z.string().trim().min(1).max(2000),
  website: z.string().url().max(200).optional(),
})

websitePublicRoute.post(
  '/:slug/prayers',
  zValidator('json', publicPrayerSchema, (result, c) => {
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
            prayerText: data.prayerText,
            isVisible: false,
          },
        },
        201,
      )
    }

    const entry = await prayersService.create({
      weddingId: config.weddingId,
      authorName: data.authorName,
      prayerText: data.prayerText,
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
  website: z.string().optional(),
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

    // Honeypot check — bots fill hidden "website" field
    if (data.website) {
      return c.json({ data: { success: true } })
    }

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

// POST /website-public/:slug/photos/upload — proxy upload to R2 (NO auth, avoids CORS)
websitePublicRoute.post('/:slug/photos/upload', async (c) => {
  const slug = c.req.param('slug')

  const config = await resolvePublicConfig(slug)
  if (!config) {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if (config.privacyMode === 'password') {
    return c.json({ error: 'Website not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  const body = await c.req.parseBody()
  const file = body['file']
  const uploaderName = typeof body['uploaderName'] === 'string' ? body['uploaderName'].trim() : ''
  const rawEmail =
    typeof body['uploaderEmail'] === 'string' && body['uploaderEmail'].trim()
      ? body['uploaderEmail'].trim()
      : null
  const uploaderEmail = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : null

  if (!(file instanceof File) || !uploaderName) {
    return c.json(
      { error: 'Missing file or uploaderName', code: 'VALIDATION_ERROR', statusCode: 400 },
      400,
    )
  }

  // Read file bytes once for both magic-byte validation and R2 upload
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  // Validate file content matches declared MIME type via magic bytes
  const magicBytes: Record<string, number[][]> = {
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  }
  const expectedMagic = magicBytes[file.type]
  if (expectedMagic) {
    const headerSlice = Array.from(fileBuffer.subarray(0, 4))
    const valid = expectedMagic.some((magic) => magic.every((b, i) => headerSlice[i] === b))
    if (!valid) {
      return c.json(
        {
          error: 'File content does not match declared type',
          code: 'INVALID_FILE',
          statusCode: 400,
        },
        400,
      )
    }
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return c.json({ error: 'Invalid image type', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { error: 'File too large (max 20MB)', code: 'VALIDATION_ERROR', statusCode: 400 },
      400,
    )
  }

  if (uploaderName.length > 100) {
    return c.json({ error: 'Name too long', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }

  try {
    const photoId = randomUUID()
    const r2Key = storageClient.buildGalleryPhotoKey(config.weddingId, photoId, file.name)
    const buffer = fileBuffer
    await storageClient.uploadBuffer(r2Key, buffer, file.type)
    const publicUrl = await storageClient.getDownloadUrl(r2Key)

    const [photo] = await db
      .insert(photos)
      .values({
        weddingId: config.weddingId,
        r2Key,
        url: publicUrl,
        fileName: file.name.slice(0, 255),
        mimeType: file.type,
        fileSize: file.size,
        uploaderName,
        uploaderEmail,
        source: 'guest',
        moderationStatus: 'pending',
      })
      .returning()

    return c.json({ data: photo }, 201)
  } catch (err) {
    console.error('Failed to upload guest photo:', err)
    return c.json(
      { error: 'Photo upload is temporarily unavailable', code: 'STORAGE_ERROR', statusCode: 503 },
      503,
    )
  }
})
