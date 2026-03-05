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

vi.mock('../services/activity.js', () => ({
  activityService: {
    getRecent: vi.fn(),
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

import { activityRoute } from './activity.js'
import { activityService } from '../services/activity.js'

const mockedService = vi.mocked(activityService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/activity', activityRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Activity Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /activity', () => {
    it('should list recent activity', async () => {
      const mockActivities = [
        {
          id: 'b0000000-0000-0000-0000-000000000001',
          weddingId: WEDDING_ID,
          userId: 'db-user-id',
          action: 'created',
          entityType: 'task',
          entityId: 'c0000000-0000-0000-0000-000000000001',
          metadata: null,
          createdAt: new Date().toISOString(),
          user: { firstName: 'Jane', lastName: 'Doe', avatarUrl: null },
        },
        {
          id: 'b0000000-0000-0000-0000-000000000002',
          weddingId: WEDDING_ID,
          userId: 'db-user-id',
          action: 'updated',
          entityType: 'guest',
          entityId: 'c0000000-0000-0000-0000-000000000002',
          metadata: null,
          createdAt: new Date().toISOString(),
          user: { firstName: 'Jane', lastName: 'Doe', avatarUrl: null },
        },
      ]
      mockedService.getRecent.mockResolvedValue(mockActivities as never)

      const app = createApp()
      const res = await app.request(`/activity?weddingId=${WEDDING_ID}&limit=10`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.data[0].action).toBe('created')
      expect(body.data[1].entityType).toBe('guest')
      expect(mockedService.getRecent).toHaveBeenCalledWith(WEDDING_ID, 10)
    })

    it('should use default limit of 20 when not specified', async () => {
      mockedService.getRecent.mockResolvedValue([] as never)

      const app = createApp()
      const res = await app.request(`/activity?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(0)
      expect(mockedService.getRecent).toHaveBeenCalledWith(WEDDING_ID, 20)
    })

    it('should return 401 without authorization header', async () => {
      const app = createApp()
      const res = await app.request(`/activity?weddingId=${WEDDING_ID}`, {
        method: 'GET',
      })

      expect(res.status).toBe(401)
    })

    it('should return 400 for invalid weddingId', async () => {
      const app = createApp()
      const res = await app.request('/activity?weddingId=not-a-uuid', {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
    })

    it('should return 400 for limit exceeding maximum', async () => {
      const app = createApp()
      const res = await app.request(`/activity?weddingId=${WEDDING_ID}&limit=200`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
    })
  })
})
