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

vi.mock('../services/website-analytics.js', () => ({
  websiteAnalyticsService: {
    getSummary: vi.fn(),
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
      canInbox: true,
      canMusicIntegration: true,
      canPhotoGallery: true,
    }),
  },
}))

import { websiteAnalyticsRoute } from './website-analytics.js'
import { websiteAnalyticsService } from '../services/website-analytics.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(websiteAnalyticsService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/website-analytics', websiteAnalyticsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Website Analytics Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /website-analytics', () => {
    it('should return analytics summary for full tier', async () => {
      const summary = {
        totalViews: 142,
        uniqueVisitors: 87,
        viewsByDay: [
          { date: '2026-03-01', count: 25 },
          { date: '2026-03-02', count: 38 },
        ],
        viewsBySection: [
          { section: 'hero', count: 120 },
          { section: 'rsvp', count: 65 },
        ],
        viewsByCountry: [
          { country: 'US', count: 60 },
          { country: 'GB', count: 15 },
        ],
        topReferrers: [{ referrer: 'https://instagram.com', count: 30 }],
      }
      mockedService.getSummary.mockResolvedValue(summary)

      const app = createApp()
      const res = await app.request(`/website-analytics?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.totalViews).toBe(142)
      expect(body.data.uniqueVisitors).toBe(87)
      expect(body.data.viewsByDay).toHaveLength(2)
      expect(body.data.viewsBySection).toHaveLength(2)
      expect(mockedService.getSummary).toHaveBeenCalledWith(WEDDING_ID)
    })

    it('should return 403 on free tier (canWebsiteAnalytics gated)', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue({
        tier: 'free',
        canAddTasks: false,
        canEditChecklist: false,
        canDeleteTasks: false,
        canReorderTasks: false,
        canCustomizeCategories: false,
        canAddNotes: false,
        canAddAttachments: false,
        maxGuests: 15,
        canEditGuests: false,
        canDeleteGuests: false,
        canBulkImport: false,
        canRsvp: false,
        canSeatingChart: false,
        canVendorManagement: false,
        canCustomDomain: false,
        canDataExport: false,
        canBudgetCategories: false,
        canBudgetExpenses: false,
        canBudgetAnalytics: false,
        canBudgetExport: false,
        canPaymentSchedule: false,
        canWebsiteBuilder: true,
        canWebsiteAnalytics: false,
        canWebsiteCustomSections: false,
      })

      const app = createApp()
      const res = await app.request(`/website-analytics?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_LOCKED')
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request(`/website-analytics`, { method: 'GET', headers: authHeaders() })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
