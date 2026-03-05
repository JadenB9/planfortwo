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

vi.mock('../services/honeymoon.js', () => ({
  honeymoonService: {
    listPlans: vi.fn(),
    getPlan: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
    addActivity: vi.fn(),
    updateActivity: vi.fn(),
    deleteActivity: vi.fn(),
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

import { honeymoonRoute } from './honeymoon.js'
import { honeymoonService } from '../services/honeymoon.js'

const mockedService = vi.mocked(honeymoonService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const PLAN_ID = 'b0000000-0000-0000-0000-000000000003'
const ACTIVITY_ID = 'c0000000-0000-0000-0000-000000000003'

function createApp() {
  const app = new Hono()
  app.route('/honeymoon', honeymoonRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Honeymoon Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /honeymoon', () => {
    it('should list honeymoon plans', async () => {
      mockedService.listPlans.mockResolvedValue([
        {
          id: PLAN_ID,
          weddingId: WEDDING_ID,
          destination: 'Maldives',
          startDate: null,
          endDate: null,
          budget: 5000,
          notes: null,
          documents: [],
          packingList: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/honeymoon?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].destination).toBe('Maldives')
    })
  })

  describe('POST /honeymoon', () => {
    it('should create a honeymoon plan', async () => {
      mockedService.createPlan.mockResolvedValue({
        id: PLAN_ID,
        weddingId: WEDDING_ID,
        destination: 'Bali',
        startDate: null,
        endDate: null,
        budget: 3000,
        notes: null,
        documents: [],
        packingList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/honeymoon?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, destination: 'Bali', budget: 3000 }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.destination).toBe('Bali')
    })
  })

  describe('GET /honeymoon/:id', () => {
    it('should get plan with activities', async () => {
      mockedService.getPlan.mockResolvedValue({
        id: PLAN_ID,
        weddingId: WEDDING_ID,
        destination: 'Maldives',
        startDate: null,
        endDate: null,
        budget: 5000,
        notes: null,
        documents: [],
        packingList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        activities: [
          {
            id: ACTIVITY_ID,
            planId: PLAN_ID,
            dayNumber: 1,
            title: 'Snorkeling',
            description: null,
            location: 'Resort reef',
            startTime: '10:00',
            endTime: '12:00',
            cost: 50,
            sortOrder: 0,
            createdAt: new Date(),
          },
        ],
      } as never)

      const app = createApp()
      const res = await app.request(`/honeymoon/${PLAN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.activities).toHaveLength(1)
    })

    it('should return 404 if not found', async () => {
      mockedService.getPlan.mockResolvedValue(null)
      const app = createApp()
      const res = await app.request(`/honeymoon/${PLAN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /honeymoon/:id', () => {
    it('should update a plan', async () => {
      mockedService.updatePlan.mockResolvedValue({
        id: PLAN_ID,
        weddingId: WEDDING_ID,
        destination: 'Updated',
        startDate: null,
        endDate: null,
        budget: 6000,
        notes: null,
        documents: [],
        packingList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/honeymoon/${PLAN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ destination: 'Updated', budget: 6000 }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /honeymoon/:id', () => {
    it('should delete a plan', async () => {
      mockedService.deletePlan.mockResolvedValue({ id: PLAN_ID } as never)
      const app = createApp()
      const res = await app.request(`/honeymoon/${PLAN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /honeymoon/:id/activities', () => {
    it('should add an activity', async () => {
      mockedService.addActivity.mockResolvedValue({
        id: ACTIVITY_ID,
        planId: PLAN_ID,
        dayNumber: 2,
        title: 'Spa Day',
        description: null,
        location: null,
        startTime: null,
        endTime: null,
        cost: 200,
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/honeymoon/${PLAN_ID}/activities?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ planId: PLAN_ID, dayNumber: 2, title: 'Spa Day', cost: 200 }),
      })
      expect(res.status).toBe(201)
    })
  })

  describe('PUT /honeymoon/activities/:activityId', () => {
    it('should update an activity', async () => {
      mockedService.updateActivity.mockResolvedValue({
        id: ACTIVITY_ID,
        planId: PLAN_ID,
        dayNumber: 2,
        title: 'Updated Spa',
        description: null,
        location: null,
        startTime: null,
        endTime: null,
        cost: 250,
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/honeymoon/activities/${ACTIVITY_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ title: 'Updated Spa', cost: 250 }),
        },
      )
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /honeymoon/activities/:activityId', () => {
    it('should delete an activity', async () => {
      mockedService.deleteActivity.mockResolvedValue({ id: ACTIVITY_ID } as never)
      const app = createApp()
      const res = await app.request(
        `/honeymoon/activities/${ACTIVITY_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        },
      )
      expect(res.status).toBe(200)
    })
  })
})
