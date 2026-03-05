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

vi.mock('../services/events.js', () => ({
  eventService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listTimeline: vi.fn(),
    createTimelineEntry: vi.fn(),
    updateTimelineEntry: vi.fn(),
    deleteTimelineEntry: vi.fn(),
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

import { eventsRoute } from './events.js'
import { eventService } from '../services/events.js'
import { featureService } from '../services/features.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedService = vi.mocked(eventService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const EVENT_ID = 'b0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/events', eventsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Event Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.mocked(userService.findByClerkId).mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    })
    vi.mocked(weddingService.verifyMembership).mockResolvedValue({
      id: 'member-1',
      weddingId: WEDDING_ID,
      userId: 'db-user-id',
      role: 'owner',
      joinedAt: new Date(),
    })
    mockedService.getById.mockResolvedValue({
      id: EVENT_ID,
      weddingId: WEDDING_ID,
      name: 'Ceremony',
      description: null,
      date: null,
      startTime: null,
      endTime: null,
      venue: null,
      address: null,
      dressCode: null,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
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
    })
  })

  describe('GET /events', () => {
    it('should list events', async () => {
      mockedService.list.mockResolvedValue([
        {
          id: EVENT_ID,
          weddingId: WEDDING_ID,
          name: 'Ceremony',
          description: null,
          date: null,
          startTime: '2:00 PM',
          endTime: '3:00 PM',
          venue: 'Church',
          address: null,
          dressCode: 'Formal',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/events?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Ceremony')
    })
  })

  describe('POST /events', () => {
    it('should create an event', async () => {
      mockedService.create.mockResolvedValue({
        id: EVENT_ID,
        weddingId: WEDDING_ID,
        name: 'Reception',
        description: 'Dinner and dancing',
        date: null,
        startTime: '6:00 PM',
        endTime: '11:00 PM',
        venue: 'Grand Ballroom',
        address: null,
        dressCode: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/events?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          name: 'Reception',
          description: 'Dinner and dancing',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Reception')
    })
  })

  describe('PUT /events/:id', () => {
    it('should update an event', async () => {
      mockedService.update.mockResolvedValue({
        id: EVENT_ID,
        weddingId: WEDDING_ID,
        name: 'Updated Reception',
        description: null,
        date: null,
        startTime: null,
        endTime: null,
        venue: null,
        address: null,
        dressCode: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/events/${EVENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'Updated Reception' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('Updated Reception')
    })
  })

  describe('POST /events/:id/timeline', () => {
    it('should create a timeline entry', async () => {
      mockedService.createTimelineEntry.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000001',
        eventId: EVENT_ID,
        weddingId: WEDDING_ID,
        time: '2:00 PM',
        title: 'Processional',
        description: null,
        responsiblePerson: null,
        location: null,
        notes: null,
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/events/${EVENT_ID}/timeline?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          eventId: EVENT_ID,
          weddingId: WEDDING_ID,
          time: '2:00 PM',
          title: 'Processional',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Processional')
    })
  })

  describe('GET /events/:id/timeline', () => {
    it('should list timeline entries', async () => {
      mockedService.listTimeline.mockResolvedValue([
        {
          id: 'c0000000-0000-0000-0000-000000000001',
          eventId: EVENT_ID,
          weddingId: WEDDING_ID,
          time: '2:00 PM',
          title: 'Processional',
          description: null,
          responsiblePerson: null,
          location: null,
          notes: null,
          sortOrder: 0,
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/events/${EVENT_ID}/timeline?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })
  })

  describe('DELETE /events/:id', () => {
    it('should delete an event', async () => {
      mockedService.delete.mockResolvedValue(true as never)
      const app = createApp()
      const res = await app.request(`/events/${EVENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })

    it('should return 404 for non-existent event', async () => {
      mockedService.delete.mockResolvedValue(false as never)
      const app = createApp()
      const res = await app.request(`/events/${EVENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })
})
