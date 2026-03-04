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

vi.mock('../services/payment-schedule.js', () => ({
  paymentScheduleService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

import { paymentScheduleRoute } from './payment-schedule.js'
import { paymentScheduleService } from '../services/payment-schedule.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(paymentScheduleService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const ITEM_ID = 'd0000000-0000-0000-0000-000000000001'
const PAYMENT_ID = 'e0000000-0000-0000-0000-000000000001'

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
  app.route('/payment-schedule', paymentScheduleRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

const mockBudgetItem = {
  id: ITEM_ID,
  weddingId: WEDDING_ID,
  categoryId: 'c0000000-0000-0000-0000-000000000002',
  vendorName: 'Grand Ballroom',
  description: 'Venue rental',
  amount: 10000,
  paidAmount: 0,
  paymentStatus: 'unpaid' as const,
  payer: 'couple' as const,
  dueDate: null,
  paidDate: null,
  receiptUrl: null,
  receiptFileName: null,
  notes: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPayment = {
  id: PAYMENT_ID,
  weddingId: WEDDING_ID,
  budgetItemId: ITEM_ID,
  title: 'Venue deposit installment 1',
  amount: 2500,
  dueDate: new Date('2026-06-01'),
  isPaid: false,
  paidDate: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  budgetItem: mockBudgetItem,
}

describe('Payment Schedule Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /payment-schedule', () => {
    it('should list all payments', async () => {
      mockedService.list.mockResolvedValue([mockPayment] as never)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule?weddingId=${WEDDING_ID}`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Venue deposit installment 1')
    })

    it('should filter upcoming payments', async () => {
      mockedService.list.mockResolvedValue([] as never)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule?weddingId=${WEDDING_ID}&filter=upcoming`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      expect(mockedService.list).toHaveBeenCalledWith(
        WEDDING_ID,
        'upcoming',
      )
    })

    it('should filter overdue payments', async () => {
      mockedService.list.mockResolvedValue([] as never)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule?weddingId=${WEDDING_ID}&filter=overdue`,
        { method: 'GET', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      expect(mockedService.list).toHaveBeenCalledWith(
        WEDDING_ID,
        'overdue',
      )
    })
  })

  describe('POST /payment-schedule', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      budgetItemId: ITEM_ID,
      title: 'Venue deposit installment 1',
      amount: 2500,
      dueDate: '2026-06-01T00:00:00.000Z',
    }

    it('should create a payment schedule entry', async () => {
      mockedService.create.mockResolvedValue({
        id: PAYMENT_ID,
        weddingId: WEDDING_ID,
        budgetItemId: ITEM_ID,
        title: 'Venue deposit installment 1',
        amount: 2500,
        dueDate: new Date('2026-06-01'),
        isPaid: false,
        paidDate: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule?weddingId=${WEDDING_ID}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(validBody),
        },
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Venue deposit installment 1')
      expect(body.data.amount).toBe(2500)
    })

    it('should return 403 on free tier (canPaymentSchedule gated)', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule?weddingId=${WEDDING_ID}`,
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

  describe('PUT /payment-schedule/:id', () => {
    it('should update a payment', async () => {
      mockedService.update.mockResolvedValue({
        ...mockPayment,
        title: 'Updated installment',
        budgetItem: undefined,
      } as never)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule/${PAYMENT_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ title: 'Updated installment' }),
        },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Updated installment')
    })

    it('should mark payment as paid', async () => {
      mockedService.update.mockResolvedValue({
        ...mockPayment,
        isPaid: true,
        paidDate: new Date(),
        budgetItem: undefined,
      } as never)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule/${PAYMENT_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ isPaid: true }),
        },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isPaid).toBe(true)
      expect(body.data.paidDate).toBeTruthy()
    })

    it('should return 404 for non-existent payment', async () => {
      mockedService.update.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule/${PAYMENT_ID}?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ title: 'Updated' }),
        },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('PAYMENT_NOT_FOUND')
    })
  })

  describe('DELETE /payment-schedule/:id', () => {
    it('should delete a payment', async () => {
      mockedService.delete.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(
        `/payment-schedule/${PAYMENT_ID}?weddingId=${WEDDING_ID}`,
        { method: 'DELETE', headers: authHeaders() },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 for non-existent payment', async () => {
      mockedService.delete.mockRejectedValue(
        new Error('Payment schedule entry not found'),
      )

      const app = createApp()
      const res = await app.request(
        `/payment-schedule/${PAYMENT_ID}?weddingId=${WEDDING_ID}`,
        { method: 'DELETE', headers: authHeaders() },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('DELETE_FAILED')
    })
  })
})
