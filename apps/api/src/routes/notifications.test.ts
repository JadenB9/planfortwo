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

vi.mock('../services/notifications.js', () => ({
  notificationsService: {
    getBadgeCounts: vi.fn(),
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

import { notificationsRoute } from './notifications.js'
import { notificationsService } from '../services/notifications.js'

const mockedService = vi.mocked(notificationsService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/notifications', notificationsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Notifications Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /notifications/badges', () => {
    it('should return badge counts', async () => {
      const mockCounts = {
        inbox: 3,
        music: 5,
        photos: 2,
        messages: 1,
        prayers: 4,
      }
      mockedService.getBadgeCounts.mockResolvedValue(mockCounts as never)

      const app = createApp()
      const res = await app.request(`/notifications/badges?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toEqual(mockCounts)
      expect(body.data.inbox).toBe(3)
      expect(body.data.music).toBe(5)
      expect(body.data.photos).toBe(2)
      expect(body.data.messages).toBe(1)
      expect(body.data.prayers).toBe(4)
    })

    it('should return zero counts', async () => {
      const zeroCounts = {
        inbox: 0,
        music: 0,
        photos: 0,
        messages: 0,
        prayers: 0,
      }
      mockedService.getBadgeCounts.mockResolvedValue(zeroCounts as never)

      const app = createApp()
      const res = await app.request(`/notifications/badges?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toEqual(zeroCounts)
    })

    it('should require authentication', async () => {
      const app = createApp()
      const res = await app.request(`/notifications/badges?weddingId=${WEDDING_ID}`, {
        method: 'GET',
      })
      expect(res.status).toBe(401)
    })
  })
})
