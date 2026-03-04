import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Hoist mock state so vi.mock factories (which are hoisted) can access it
const { queryResults, queryIndex } = vi.hoisted(() => {
  return {
    queryResults: [] as unknown[][],
    queryIndex: { value: 0 },
  }
})

vi.mock('@planfortwo/db', () => {
  function makeChain() {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.from = vi.fn().mockReturnValue(chain)
    chain.where = vi.fn().mockReturnValue(chain)
    chain.orderBy = vi.fn().mockReturnValue(chain)
    chain.insert = vi.fn().mockReturnValue(chain)
    chain.values = vi.fn().mockReturnValue(chain)
    chain.then = (resolve: (v: unknown) => void) => {
      const result = queryResults[queryIndex.value] ?? []
      queryIndex.value++
      resolve(result)
    }
    return chain
  }

  return {
    db: {
      select: vi.fn(() => makeChain()),
      insert: vi.fn(() => {
        const chain: Record<string, unknown> = {}
        chain.values = vi.fn().mockReturnValue(chain)
        chain.returning = vi.fn().mockReturnValue(chain)
        chain.then = (resolve: (v: unknown) => void) => resolve([])
        return chain
      }),
    },
    websiteConfigs: { subdomain: 'subdomain', weddingId: 'weddingId' },
    websiteSections: { weddingId: 'weddingId', isVisible: 'isVisible', sortOrder: 'sortOrder' },
    websitePhotos: { weddingId: 'weddingId', sortOrder: 'sortOrder' },
    websitePageViews: {},
    weddings: { id: 'id', name: 'name', date: 'date' },
  }
})

vi.mock('../services/website-analytics.js', () => ({
  websiteAnalyticsService: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../services/guestbook.js', () => ({
  guestbookService: {
    listApproved: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  asc: vi.fn((col: unknown) => col),
}))

import { websitePublicRoute } from './website-public.js'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { guestbookService } from '../services/guestbook.js'

const mockedAnalytics = vi.mocked(websiteAnalyticsService)
const mockedGuestbook = vi.mocked(guestbookService)

function createApp() {
  const app = new Hono()
  app.route('/website-public', websitePublicRoute)
  return app
}

function setQueryResults(...results: unknown[][]) {
  queryResults.length = 0
  queryResults.push(...results)
  queryIndex.value = 0
}

describe('Website Public Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryResults.length = 0
    queryIndex.value = 0
    mockedAnalytics.track.mockResolvedValue(undefined)
    mockedGuestbook.listApproved.mockResolvedValue([])
  })

  describe('GET /website-public/:slug', () => {
    it('should return 404 for non-existent slug', async () => {
      setQueryResults([])

      const app = createApp()
      const res = await app.request('/website-public/non-existent')

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })

    it('should return 404 for unpublished website', async () => {
      setQueryResults([{
        id: 'config-1', weddingId: 'w-1', templateId: 'classic',
        publishedAt: null, privacyMode: 'public', passwordHash: null,
      }])

      const app = createApp()
      const res = await app.request('/website-public/my-wedding')

      expect(res.status).toBe(404)
    })

    it('should return limited info for password-protected website', async () => {
      setQueryResults([{
        id: 'config-1', weddingId: 'w-1', templateId: 'classic',
        publishedAt: new Date(), privacyMode: 'password', passwordHash: 'hashed',
      }])

      const app = createApp()
      const res = await app.request('/website-public/secret-wedding')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.requiresPassword).toBe(true)
      expect(body.data.privacyMode).toBe('password')
      expect(body.data.passwordHash).toBeUndefined()
    })

    it('should return full website data for public site', async () => {
      setQueryResults(
        [{
          id: 'config-1', weddingId: 'w-1', templateId: 'garden-party',
          publishedAt: new Date(), privacyMode: 'public', passwordHash: null,
          customColors: null, fontPair: 'playfair-lato', subdomain: 'jj-wedding',
          customDomain: null, domainVerified: false, metaTitle: 'Our Wedding',
          metaDescription: null, ogImageUrl: null, hashtag: '#JJWedding',
        }],
        [{ name: 'Jane & John', date: '2026-09-15' }],
        [{ id: 's-1', sectionType: 'hero', title: 'Welcome', isVisible: true }],
        [{ id: 'p-1', url: 'https://cdn.example.com/photo.jpg' }],
      )

      const app = createApp()
      const res = await app.request('/website-public/jj-wedding')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.templateId).toBe('garden-party')
      expect(body.data.weddingName).toBe('Jane & John')
      expect(body.data.sections).toHaveLength(1)
      expect(body.data.photos).toHaveLength(1)
      expect(body.data.passwordHash).toBeUndefined()
    })
  })

  describe('POST /website-public/:slug/track', () => {
    it('should track a page view', async () => {
      setQueryResults([{ weddingId: 'w-1' }])

      const app = createApp()
      const res = await app.request('/website-public/jj-wedding/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', sectionViewed: 'hero', referrer: 'https://instagram.com' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(mockedAnalytics.track).toHaveBeenCalled()
    })

    it('should return 404 for non-existent slug', async () => {
      setQueryResults([])

      const app = createApp()
      const res = await app.request('/website-public/fake/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('GET /website-public/:slug/guestbook', () => {
    it('should return approved guestbook entries', async () => {
      setQueryResults([{ weddingId: 'w-1' }])

      mockedGuestbook.listApproved.mockResolvedValue([
        { id: 'g-1', authorName: 'Sarah', message: 'So happy for you!', createdAt: new Date() },
      ] as never)

      const app = createApp()
      const res = await app.request('/website-public/jj-wedding/guestbook')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].authorName).toBe('Sarah')
    })

    it('should return 404 for non-existent slug', async () => {
      setQueryResults([])

      const app = createApp()
      const res = await app.request('/website-public/fake/guestbook')

      expect(res.status).toBe(404)
    })
  })
})
