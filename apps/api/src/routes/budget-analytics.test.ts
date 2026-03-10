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

vi.mock('../services/budget-analytics.js', () => ({
  budgetAnalyticsService: {
    getAnalytics: vi.fn(),
    getTipSuggestions: vi.fn(),
    getSplitSummary: vi.fn(),
    exportCsv: vi.fn(),
    exportPdf: vi.fn(),
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

import { budgetAnalyticsRoute } from './budget-analytics.js'
import { budgetAnalyticsService } from '../services/budget-analytics.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(budgetAnalyticsService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

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

const FREE_GATES = {
  tier: 'free' as const,
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
  canSeatingChart: false,
  canVendorManagement: true,
  canCustomDomain: false,
  canDataExport: true,
  canBudgetCategories: true,
  canBudgetExpenses: true,
  canBudgetAnalytics: true,
  canBudgetExport: true,
  canPaymentSchedule: true,
  canWebsiteBuilder: true,
  canWebsiteAnalytics: false,
  canWebsiteCustomSections: false,
  canInbox: false,
  canMusicIntegration: false,
  canPhotoGallery: false,
}

function createApp() {
  const app = new Hono()
  app.route('/budget', budgetAnalyticsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

const mockAnalytics = {
  totalBudget: 30000,
  totalAllocated: 28000,
  totalSpent: 12500,
  totalPaid: 8000,
  totalUnpaid: 4500,
  burnRate: 0.4167,
  perGuestCost: 125,
  projectedTotal: 25000,
  categoryBreakdown: [
    {
      categoryId: 'c1',
      name: 'Venue & Catering',
      color: '#E57373',
      allocated: 15000,
      spent: 8000,
      remaining: 7000,
      percentUsed: 53.33,
    },
    {
      categoryId: 'c2',
      name: 'Photography',
      color: '#4CAF50',
      allocated: 5000,
      spent: 2500,
      remaining: 2500,
      percentUsed: 50,
    },
  ],
  monthlySpending: [
    { month: '2026-01', amount: 5000 },
    { month: '2026-02', amount: 7500 },
  ],
}

describe('Budget Analytics Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /budget/analytics', () => {
    it('should return full analytics', async () => {
      mockedService.getAnalytics.mockResolvedValue(mockAnalytics as never)

      const app = createApp()
      const res = await app.request(`/budget/analytics?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.totalBudget).toBe(30000)
      expect(body.data.totalSpent).toBe(12500)
      expect(body.data.categoryBreakdown).toHaveLength(2)
      expect(body.data.monthlySpending).toHaveLength(2)
    })

    it('should handle empty budget', async () => {
      const emptyAnalytics = {
        totalBudget: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        burnRate: 0,
        perGuestCost: 0,
        projectedTotal: 0,
        categoryBreakdown: [],
        monthlySpending: [],
      }
      mockedService.getAnalytics.mockResolvedValue(emptyAnalytics as never)

      const app = createApp()
      const res = await app.request(`/budget/analytics?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.totalBudget).toBe(0)
      expect(body.data.totalSpent).toBe(0)
      expect(body.data.categoryBreakdown).toHaveLength(0)
    })
  })

  describe('GET /budget/tips', () => {
    it('should return tip suggestions', async () => {
      const mockTips = [
        {
          vendorType: 'Catering',
          suggestedAmount: 1200,
          suggestedPercent: 15,
          min: 800,
          max: 1600,
        },
        {
          vendorType: 'Photography',
          suggestedAmount: 250,
          suggestedPercent: 10,
          min: 125,
          max: 500,
        },
      ]
      mockedService.getTipSuggestions.mockResolvedValue(mockTips as never)

      const app = createApp()
      const res = await app.request(`/budget/tips?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
      expect(body.data[0].vendorType).toBe('Catering')
      expect(body.data[0].suggestedAmount).toBe(1200)
    })
  })

  describe('GET /budget/splits', () => {
    it('should return split cost summary', async () => {
      const mockSplits = {
        couple: { total: 8000, percentage: 64 },
        brideFamily: { total: 3000, percentage: 24 },
        groomFamily: { total: 1500, percentage: 12 },
        other: { total: 0, percentage: 0 },
      }
      mockedService.getSplitSummary.mockResolvedValue(mockSplits as never)

      const app = createApp()
      const res = await app.request(`/budget/splits?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.couple.total).toBe(8000)
      expect(body.data.brideFamily.total).toBe(3000)
      expect(body.data.groomFamily.total).toBe(1500)
    })

    it('should handle all-couple payer', async () => {
      const mockSplits = {
        couple: { total: 12500, percentage: 100 },
        brideFamily: { total: 0, percentage: 0 },
        groomFamily: { total: 0, percentage: 0 },
        other: { total: 0, percentage: 0 },
      }
      mockedService.getSplitSummary.mockResolvedValue(mockSplits as never)

      const app = createApp()
      const res = await app.request(`/budget/splits?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.couple.percentage).toBe(100)
      expect(body.data.brideFamily.percentage).toBe(0)
    })
  })

  describe('GET /budget/export/csv', () => {
    it('should export CSV with correct columns', async () => {
      const csvContent =
        'Category,Vendor,Description,Amount,Paid,Status,Payer,Due Date,Notes\n' +
        'Venue & Catering,Grand Ballroom,Venue rental,10000.00,5000.00,partial,couple,2026-06-01,'
      mockedService.exportCsv.mockResolvedValue(csvContent)

      const app = createApp()
      const res = await app.request(`/budget/export/csv?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/csv')
      expect(res.headers.get('Content-Disposition')).toContain('budget-export.csv')
      const text = await res.text()
      expect(text).toContain('Category')
      expect(text).toContain('Grand Ballroom')
    })
  })

  describe('GET /budget/export/pdf', () => {
    it('should export PDF with correct content-type', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 mock content')
      mockedService.exportPdf.mockResolvedValue(pdfBuffer)

      const app = createApp()
      const res = await app.request(`/budget/export/pdf?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/pdf')
      expect(res.headers.get('Content-Disposition')).toContain('budget-report.pdf')
    })
  })
})
