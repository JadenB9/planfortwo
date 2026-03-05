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

vi.mock('../services/guestbook.js', () => ({
  guestbookService: {
    list: vi.fn(),
    listApproved: vi.fn(),
    create: vi.fn(),
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
    }),
  },
}))

import { guestbookRoute } from './guestbook.js'
import { guestbookService } from '../services/guestbook.js'

const mockedService = vi.mocked(guestbookService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const ENTRY_ID = 'g0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/guestbook', guestbookRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Guestbook Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('POST /guestbook (public)', () => {
    it('should create a guestbook entry without auth', async () => {
      mockedService.create.mockResolvedValue({
        id: ENTRY_ID,
        weddingId: WEDDING_ID,
        authorName: 'John',
        message: 'Congrats!',
        isApproved: false,
        isVisible: true,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          authorName: 'John',
          message: 'Congrats!',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.authorName).toBe('John')
    })
  })

  describe('GET /guestbook (admin)', () => {
    it('should list all entries with auth', async () => {
      mockedService.list.mockResolvedValue([
        {
          id: ENTRY_ID,
          weddingId: WEDDING_ID,
          authorName: 'John',
          message: 'Congrats!',
          isApproved: false,
          isVisible: true,
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/guestbook?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })
  })

  describe('PUT /guestbook/:id/approve', () => {
    it('should approve an entry', async () => {
      mockedService.approve.mockResolvedValue({
        id: ENTRY_ID,
        weddingId: WEDDING_ID,
        authorName: 'John',
        message: 'Congrats!',
        isApproved: true,
        isVisible: true,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/guestbook/${ENTRY_ID}/approve?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ approved: true }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isApproved).toBe(true)
    })
  })

  describe('DELETE /guestbook/:id', () => {
    it('should delete an entry', async () => {
      mockedService.delete.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/guestbook/${ENTRY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
    })

    it('should return 404 for non-existent entry', async () => {
      mockedService.delete.mockRejectedValue(new Error('Guestbook entry not found'))

      const app = createApp()
      const res = await app.request(`/guestbook/${ENTRY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
    })
  })
})
