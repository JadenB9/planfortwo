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

vi.mock('../services/checklist.js', () => ({
  checklistService: {
    listCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
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
      canRsvp: true,
      canSeatingChart: true,
      canVendorManagement: true,
      canCustomDomain: true,
      canDataExport: true,
    }),
  },
}))

import { categoriesRoute } from './categories.js'
import { checklistService } from '../services/checklist.js'
import { featureService } from '../services/features.js'

const mockedChecklistService = vi.mocked(checklistService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const CATEGORY_ID = 'c0000000-0000-0000-0000-000000000001'

const FREE_GATES = {
  tier: 'free' as const,
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
}

function createApp() {
  const app = new Hono()
  app.route('/categories', categoriesRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Category Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')

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
  })

  describe('GET /categories', () => {
    it('should return categories with counts', async () => {
      const mockCategories = [
        {
          id: CATEGORY_ID,
          name: 'Venue & Catering',
          color: '#E57373',
          icon: 'utensils',
          taskCount: 5,
          completedCount: 2,
        },
      ]
      mockedChecklistService.listCategories.mockResolvedValue(mockCategories as never)

      const app = createApp()
      const res = await app.request(`/categories?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].taskCount).toBe(5)
    })
  })

  describe('POST /categories', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      name: 'DIY Projects',
      color: '#4CAF50',
      icon: 'scissors',
    }

    it('should create a category', async () => {
      mockedChecklistService.createCategory.mockResolvedValue({
        id: CATEGORY_ID,
        ...validBody,
        isDefault: false,
      } as never)

      const app = createApp()
      const res = await app.request(`/categories?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('DIY Projects')
    })

    it('should return 403 when free tier', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)

      const app = createApp()
      const res = await app.request(`/categories?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_LOCKED')
    })
  })

  describe('PUT /categories/:id', () => {
    const updateBody = { name: 'Updated Category' }

    it('should update a category', async () => {
      mockedChecklistService.updateCategory.mockResolvedValue({
        id: CATEGORY_ID,
        name: 'Updated Category',
      } as never)

      const app = createApp()
      const res = await app.request(`/categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateBody),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('Updated Category')
    })

    it('should return 403 when free tier', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)

      const app = createApp()
      const res = await app.request(`/categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateBody),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_LOCKED')
    })
  })

  describe('DELETE /categories/:id', () => {
    it('should delete a category', async () => {
      mockedChecklistService.deleteCategory.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 403 when free tier', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)

      const app = createApp()
      const res = await app.request(`/categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_LOCKED')
    })
  })
})
