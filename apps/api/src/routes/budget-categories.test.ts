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

vi.mock('../services/budget-categories.js', () => ({
  budgetCategoryService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    seedDefaults: vi.fn(),
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

import { budgetCategoriesRoute } from './budget-categories.js'
import { budgetCategoryService } from '../services/budget-categories.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(budgetCategoryService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const CATEGORY_ID = 'c0000000-0000-0000-0000-000000000002'

const FULL_GATES = {
  tier: 'full' as const,
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
}

function createApp() {
  const app = new Hono()
  app.route('/budget-categories', budgetCategoriesRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Budget Category Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /budget-categories', () => {
    it('should list categories for a wedding', async () => {
      const mockCategories = [
        {
          id: CATEGORY_ID,
          weddingId: WEDDING_ID,
          name: 'Venue & Catering',
          icon: 'utensils',
          color: '#E57373',
          allocatedAmount: 15000,
          sortOrder: 0,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockedService.list.mockResolvedValue(mockCategories as never)

      const app = createApp()
      const res = await app.request(`/budget-categories?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Venue & Catering')
      expect(body.data[0].allocatedAmount).toBe(15000)
    })
  })

  describe('POST /budget-categories', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      name: 'Photography',
      icon: 'camera',
      color: '#4CAF50',
      allocatedAmount: 5000,
    }

    it('should create a budget category on full tier', async () => {
      mockedService.create.mockResolvedValue({
        id: CATEGORY_ID,
        weddingId: WEDDING_ID,
        name: 'Photography',
        icon: 'camera',
        color: '#4CAF50',
        allocatedAmount: 5000,
        sortOrder: 0,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/budget-categories?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Photography')
    })
  })

  describe('POST /budget-categories/seed-defaults', () => {
    it('should seed default categories', async () => {
      mockedService.seedDefaults.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/budget-categories/seed-defaults?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          totalBudget: 30000,
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(mockedService.seedDefaults).toHaveBeenCalledWith(WEDDING_ID, 30000, 'db-user-id')
    })
  })

  describe('PUT /budget-categories/:id', () => {
    const updateBody = { name: 'Updated Category' }

    it('should update a category', async () => {
      mockedService.update.mockResolvedValue({
        id: CATEGORY_ID,
        weddingId: WEDDING_ID,
        name: 'Updated Category',
        icon: 'camera',
        color: '#4CAF50',
        allocatedAmount: 5000,
        sortOrder: 0,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/budget-categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateBody),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('Updated Category')
    })

    it('should update allocation amount', async () => {
      mockedService.update.mockResolvedValue({
        id: CATEGORY_ID,
        weddingId: WEDDING_ID,
        name: 'Photography',
        icon: 'camera',
        color: '#4CAF50',
        allocatedAmount: 8000,
        sortOrder: 0,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/budget-categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ allocatedAmount: 8000 }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.allocatedAmount).toBe(8000)
    })

    it('should return 404 for non-existent category', async () => {
      mockedService.update.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/budget-categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateBody),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('CATEGORY_NOT_FOUND')
    })
  })

  describe('DELETE /budget-categories/:id', () => {
    it('should delete a category', async () => {
      mockedService.delete.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/budget-categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 for non-existent category', async () => {
      mockedService.delete.mockRejectedValue(new Error('Category not found'))

      const app = createApp()
      const res = await app.request(`/budget-categories/${CATEGORY_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('DELETE_FAILED')
    })
  })
})
