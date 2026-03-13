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

vi.mock('../services/prayers.js', () => ({
  prayersService: {
    list: vi.fn(),
    approve: vi.fn(),
    delete: vi.fn(),
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

import { prayersRoute } from './prayers.js'
import { prayersService } from '../services/prayers.js'

const mockedService = vi.mocked(prayersService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const PRAYER_ID = 'b0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/prayers', prayersRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Prayers Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /prayers', () => {
    it('should list all prayers for wedding', async () => {
      const mockPrayers = [
        {
          id: PRAYER_ID,
          weddingId: WEDDING_ID,
          authorName: 'Aunt Sue',
          prayerText: 'Wishing you a blessed marriage',
          isApproved: false,
          isVisible: true,
          createdAt: new Date(),
        },
        {
          id: 'c0000000-0000-0000-0000-000000000001',
          weddingId: WEDDING_ID,
          authorName: 'Uncle Bob',
          prayerText: 'God bless your union',
          isApproved: true,
          isVisible: true,
          createdAt: new Date(),
        },
      ]
      mockedService.list.mockResolvedValue(mockPrayers as never)

      const app = createApp()
      const res = await app.request(`/prayers?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.data[0].authorName).toBe('Aunt Sue')
      expect(body.data[1].authorName).toBe('Uncle Bob')
    })

    it('should return empty array when no prayers exist', async () => {
      mockedService.list.mockResolvedValue([] as never)

      const app = createApp()
      const res = await app.request(`/prayers?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(0)
    })

    it('should require authentication', async () => {
      const app = createApp()
      const res = await app.request(`/prayers?weddingId=${WEDDING_ID}`, {
        method: 'GET',
      })
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /prayers/:id/approve', () => {
    it('should approve a prayer', async () => {
      mockedService.approve.mockResolvedValue({
        id: PRAYER_ID,
        weddingId: WEDDING_ID,
        authorName: 'Aunt Sue',
        prayerText: 'Wishing you a blessed marriage',
        isApproved: true,
        isVisible: true,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}/approve?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ approved: true }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isApproved).toBe(true)
    })

    it('should unapprove a prayer', async () => {
      mockedService.approve.mockResolvedValue({
        id: PRAYER_ID,
        weddingId: WEDDING_ID,
        authorName: 'Aunt Sue',
        prayerText: 'Wishing you a blessed marriage',
        isApproved: false,
        isVisible: true,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}/approve?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ approved: false }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isApproved).toBe(false)
    })

    it('should return 404 if prayer not found', async () => {
      mockedService.approve.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}/approve?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ approved: true }),
      })
      expect(res.status).toBe(404)
    })

    it('should reject invalid body (missing approved field)', async () => {
      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}/approve?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })

    it('should reject invalid body (wrong type)', async () => {
      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}/approve?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ approved: 'yes' }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /prayers/:id', () => {
    it('should delete a prayer', async () => {
      mockedService.delete.mockResolvedValue(undefined as never)

      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 when delete fails', async () => {
      mockedService.delete.mockRejectedValue(new Error('Prayer not found') as never)

      const app = createApp()
      const res = await app.request(`/prayers/${PRAYER_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })
})
