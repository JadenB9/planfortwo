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

vi.mock('../services/budget-items.js', () => ({
  budgetItemService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getUploadUrl: vi.fn(),
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

import { budgetItemsRoute } from './budget-items.js'
import { budgetItemService } from '../services/budget-items.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(budgetItemService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const CATEGORY_ID = 'c0000000-0000-0000-0000-000000000002'
const ITEM_ID = 'd0000000-0000-0000-0000-000000000001'

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
}

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
  canEditGuests: false,
  canDeleteGuests: false,
  canBulkImport: false,
  canRsvp: false,
  canSeatingChart: false,
  canVendorManagement: false,
  canCustomDomain: false,
  canDataExport: false,
  canBudgetCategories: false,
  canBudgetExpenses: false,
  canBudgetAnalytics: false,
  canBudgetExport: false,
  canPaymentSchedule: false,
  canWebsiteBuilder: false,
  canWebsiteAnalytics: false,
  canWebsiteCustomSections: false,
}

function createApp() {
  const app = new Hono()
  app.route('/budget-items', budgetItemsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

const mockItem = {
  id: ITEM_ID,
  weddingId: WEDDING_ID,
  categoryId: CATEGORY_ID,
  vendorName: 'Grand Ballroom',
  description: 'Venue rental deposit',
  amount: 5000,
  paidAmount: 2000,
  paymentStatus: 'partial' as const,
  payer: 'couple' as const,
  dueDate: null,
  paidDate: null,
  receiptUrl: null,
  receiptFileName: null,
  notes: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
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
}

describe('Budget Item Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /budget-items', () => {
    it('should list items with category info', async () => {
      const mockResult = {
        data: [mockItem],
        total: 1,
        page: 1,
        pageSize: 25,
        hasMore: false,
      }
      mockedService.list.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].vendorName).toBe('Grand Ballroom')
      expect(body.total).toBe(1)
    })

    it('should filter by categoryId', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
        hasMore: false,
      }
      mockedService.list.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}&categoryId=${CATEGORY_ID}`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      expect(mockedService.list).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: CATEGORY_ID }),
      )
    })

    it('should filter by paymentStatus', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
        hasMore: false,
      }
      mockedService.list.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}&paymentStatus=paid`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      expect(mockedService.list).toHaveBeenCalledWith(
        expect.objectContaining({ paymentStatus: 'paid' }),
      )
    })

    it('should filter by payer', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
        hasMore: false,
      }
      mockedService.list.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}&payer=bride_family`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      expect(mockedService.list).toHaveBeenCalledWith(
        expect.objectContaining({ payer: 'bride_family' }),
      )
    })

    it('should paginate results', async () => {
      const mockResult = {
        data: [],
        total: 50,
        page: 2,
        pageSize: 10,
        hasMore: true,
      }
      mockedService.list.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}&page=2&pageSize=10`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.page).toBe(2)
      expect(body.pageSize).toBe(10)
      expect(body.hasMore).toBe(true)
    })
  })

  describe('GET /budget-items/:id', () => {
    it('should get single item with category', async () => {
      mockedService.get.mockResolvedValue(mockItem as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(ITEM_ID)
      expect(body.data.category.name).toBe('Venue & Catering')
    })

    it('should return 404 when item not found', async () => {
      mockedService.get.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('ITEM_NOT_FOUND')
    })
  })

  describe('POST /budget-items', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      categoryId: CATEGORY_ID,
      description: 'Venue rental deposit',
      amount: 5000,
      vendorName: 'Grand Ballroom',
    }

    it('should create a budget item', async () => {
      mockedService.create.mockResolvedValue({
        id: ITEM_ID,
        ...validBody,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        payer: 'couple',
        dueDate: null,
        paidDate: null,
        receiptUrl: null,
        receiptFileName: null,
        notes: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(validBody),
        },
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.description).toBe('Venue rental deposit')
      expect(body.data.amount).toBe(5000)
    })

    it('should return 403 on free tier (canBudgetExpenses gated)', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)

      const app = createApp()
      const res = await app.request(
        `/budget-items?weddingId=${WEDDING_ID}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(validBody),
        },
      )

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_LOCKED')
    })
  })

  describe('PUT /budget-items/:id', () => {
    it('should update an item', async () => {
      mockedService.update.mockResolvedValue({
        ...mockItem,
        description: 'Updated deposit',
      } as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ description: 'Updated deposit' }),
        },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.description).toBe('Updated deposit')
    })

    it('should auto-set paidDate when status changes to paid', async () => {
      mockedService.update.mockResolvedValue({
        ...mockItem,
        paymentStatus: 'paid',
        paidDate: new Date().toISOString(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ paymentStatus: 'paid' }),
        },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.paymentStatus).toBe('paid')
      expect(body.data.paidDate).toBeTruthy()
    })

    it('should return 404 for non-existent item', async () => {
      mockedService.update.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ description: 'Updated' }),
        },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('ITEM_NOT_FOUND')
    })
  })

  describe('DELETE /budget-items/:id', () => {
    it('should delete an item', async () => {
      mockedService.delete.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        { method: 'DELETE', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 for non-existent item', async () => {
      mockedService.delete.mockRejectedValue(new Error('Budget item not found'))

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}?weddingId=${WEDDING_ID}`,
        { method: 'DELETE', headers: authHeaders() },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('DELETE_FAILED')
    })
  })

  describe('POST /budget-items/:id/upload-url', () => {
    it('should return presigned upload URL', async () => {
      mockedService.getUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.example.com/upload',
        receiptUrl: 'https://r2.example.com/download',
      })

      const app = createApp()
      const res = await app.request(
        `/budget-items/${ITEM_ID}/upload-url?weddingId=${WEDDING_ID}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            weddingId: WEDDING_ID,
            fileName: 'receipt.pdf',
            contentType: 'application/pdf',
          }),
        },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.uploadUrl).toBe('https://r2.example.com/upload')
      expect(body.data.receiptUrl).toBe('https://r2.example.com/download')
    })
  })
})
