import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
    findById: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
  },
}))

vi.mock('../services/weddings.js', () => ({
  weddingService: {
    verifyMembership: vi.fn().mockResolvedValue({
      id: 'member-1',
      weddingId: 'a0000000-0000-0000-0000-000000000001',
      userId: 'db-user-id',
      role: 'owner',
      joinedAt: new Date(),
    }),
    findByUserId: vi.fn(),
  },
}))

vi.mock('../services/website-config.js', () => ({
  websiteConfigService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    setPassword: vi.fn(),
    verifyPassword: vi.fn(),
    checkSubdomain: vi.fn(),
  },
}))

vi.mock('../services/features.js', () => ({
  featureService: {
    getFeatures: vi.fn().mockResolvedValue({
      tier: 'full',
      canAddTasks: true,
      canEditChecklist: true,
      canDeleteTasks: true,
      canReorderTasks: true,
      canCustomizeCategories: true,
      canAddNotes: true,
      canAddAttachments: true,
      maxGuests: null,
      canEditGuests: true,
      canDeleteGuests: true,
      canBulkImport: true,
      canRsvp: true,
      canSeatingChart: true,
      canVendorManagement: true,
      canCustomDomain: true,
      canDataExport: true,
      canBudgetCategories: true,
      canBudgetExpenses: true,
      canBudgetAnalytics: true,
      canBudgetExport: true,
      canPaymentSchedule: true,
      canWebsiteBuilder: true,
      canWebsiteAnalytics: true,
      canWebsiteCustomSections: true,
    }),
  },
}))

import { websiteConfigRoute } from './website-config.js'
import { websiteConfigService } from '../services/website-config.js'

const mockedService = vi.mocked(websiteConfigService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const CONFIG_ID = 'w0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/website-config', websiteConfigRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Website Config Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /website-config', () => {
    it('should return config for a wedding', async () => {
      mockedService.get.mockResolvedValue({
        id: CONFIG_ID,
        weddingId: WEDDING_ID,
        templateId: 'classic',
        customColors: null,
        fontPair: 'playfair-lato',
        privacyMode: 'public',
        passwordHash: null,
        subdomain: 'jane-john',
        customDomain: null,
        domainVerified: false,
        metaTitle: null,
        metaDescription: null,
        ogImageUrl: null,
        hashtag: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/website-config?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.templateId).toBe('classic')
    })
  })

  describe('POST /website-config', () => {
    it('should create a website config', async () => {
      mockedService.create.mockResolvedValue({
        id: CONFIG_ID,
        weddingId: WEDDING_ID,
        templateId: 'modern',
        customColors: null,
        fontPair: 'playfair-lato',
        privacyMode: 'public',
        passwordHash: null,
        subdomain: 'jane-john',
        customDomain: null,
        domainVerified: false,
        metaTitle: null,
        metaDescription: null,
        ogImageUrl: null,
        hashtag: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/website-config?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          templateId: 'modern',
          subdomain: 'jane-john',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.subdomain).toBe('jane-john')
    })

    it('should return 409 if config already exists', async () => {
      mockedService.create.mockRejectedValue(
        new Error('Website config already exists for this wedding'),
      )

      const app = createApp()
      const res = await app.request(`/website-config?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          templateId: 'classic',
          subdomain: 'jane-john',
        }),
      })

      expect(res.status).toBe(409)
    })
  })

  describe('POST /website-config/:id/publish', () => {
    it('should publish the website', async () => {
      mockedService.publish.mockResolvedValue({
        id: CONFIG_ID,
        weddingId: WEDDING_ID,
        publishedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/website-config/${CONFIG_ID}/publish?weddingId=${WEDDING_ID}`,
        { method: 'POST', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
    })
  })

  describe('GET /website-config/check-subdomain', () => {
    it('should return available=true for unused subdomain', async () => {
      mockedService.checkSubdomain.mockResolvedValue(true)

      const app = createApp()
      const res = await app.request(`/website-config/check-subdomain?subdomain=new-couple`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.available).toBe(true)
    })
  })

  describe('POST /website-config/verify-password', () => {
    it('should verify password (public endpoint)', async () => {
      mockedService.verifyPassword.mockResolvedValue(true)

      const app = createApp()
      const res = await app.request(`/website-config/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: 'jane-john', password: 'secret123' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.valid).toBe(true)
    })
  })
})
