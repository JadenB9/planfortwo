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

vi.mock('../services/website-sections.js', () => ({
  websiteSectionService: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    reorder: vi.fn(),
    createCustom: vi.fn(),
    deleteCustom: vi.fn(),
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

import { websiteSectionsRoute } from './website-sections.js'
import { websiteSectionService } from '../services/website-sections.js'

const mockedService = vi.mocked(websiteSectionService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const SECTION_ID = 'b0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/website-sections', websiteSectionsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Website Section Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /website-sections', () => {
    it('should list sections for a wedding', async () => {
      mockedService.list.mockResolvedValue([
        {
          id: SECTION_ID,
          weddingId: WEDDING_ID,
          sectionType: 'hero',
          title: 'Welcome',
          content: {},
          isVisible: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/website-sections?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].sectionType).toBe('hero')
    })
  })

  describe('PUT /website-sections/:id', () => {
    it('should update a section', async () => {
      mockedService.update.mockResolvedValue({
        id: SECTION_ID,
        weddingId: WEDDING_ID,
        sectionType: 'hero',
        title: 'Updated',
        content: {},
        isVisible: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/website-sections/${SECTION_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: 'Updated' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Updated')
    })

    it('should return 404 for non-existent section', async () => {
      mockedService.update.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/website-sections/${SECTION_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: 'Test' }),
      })

      expect(res.status).toBe(404)
    })
  })

  describe('POST /website-sections/reorder', () => {
    it('should reorder sections', async () => {
      mockedService.reorder.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/website-sections/reorder?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          sections: [{ id: SECTION_ID, sortOrder: 5 }],
        }),
      })

      const body = await res.json()
      expect(body).toEqual({ data: { success: true } })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /website-sections (custom)', () => {
    it('should create a custom section', async () => {
      mockedService.createCustom.mockResolvedValue({
        id: SECTION_ID,
        weddingId: WEDDING_ID,
        sectionType: 'custom',
        title: 'My Page',
        content: { body: '' },
        isVisible: true,
        sortOrder: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/website-sections?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, title: 'My Page' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.sectionType).toBe('custom')
    })
  })

  describe('DELETE /website-sections/:id', () => {
    it('should delete a custom section', async () => {
      mockedService.deleteCustom.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/website-sections/${SECTION_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
    })

    it('should return 400 for non-custom section', async () => {
      mockedService.deleteCustom.mockRejectedValue(new Error('Only custom sections can be deleted'))

      const app = createApp()
      const res = await app.request(`/website-sections/${SECTION_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
    })
  })
})
