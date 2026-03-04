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

vi.mock('../services/features.js', () => ({
  featureService: {
    getFeatures: vi.fn(),
  },
}))

import { featuresRoute } from './features.js'
import { featureService } from '../services/features.js'

const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/features', featuresRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Feature Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /features', () => {
    it('should return full tier gates', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue({
        tier: 'full',
        canAddTasks: true,
        canEditChecklist: true,
        canDeleteTasks: true,
        canReorderTasks: true,
        canCustomizeCategories: true,
        canAddNotes: true,
        canAddAttachments: true,
        maxGuests: null,
        canRsvp: true,
        canSeatingChart: true,
        canVendorManagement: true,
        canCustomDomain: true,
        canDataExport: true,
      })

      const app = createApp()
      const res = await app.request(`/features?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.tier).toBe('full')
      expect(body.data.canAddTasks).toBe(true)
    })

    it('should return free tier gates', async () => {
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
        canRsvp: false,
        canSeatingChart: false,
        canVendorManagement: false,
        canCustomDomain: false,
        canDataExport: false,
      })

      const app = createApp()
      const res = await app.request(`/features?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.tier).toBe('free')
      expect(body.data.canAddTasks).toBe(false)
      expect(body.data.maxGuests).toBe(15)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request('/features', {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
