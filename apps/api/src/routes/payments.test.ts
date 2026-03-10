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

vi.mock('../services/payments.js', () => ({
  purchaseService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
  referralService: {
    getByCode: vi.fn(),
    create: vi.fn(),
    listByUser: vi.fn(),
    redeem: vi.fn(),
  },
  contactService: {
    list: vi.fn(),
    create: vi.fn(),
    markRead: vi.fn(),
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

import { purchasesRoute, referralsRoute, contactRoute } from './payments.js'
import { purchaseService, referralService, contactService } from '../services/payments.js'

const mockedPurchases = vi.mocked(purchaseService)
const mockedReferrals = vi.mocked(referralService)
const mockedContact = vi.mocked(contactService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/purchases', purchasesRoute)
  app.route('/referrals', referralsRoute)
  app.route('/contact', contactRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Payment & Growth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /purchases', () => {
    it('should list purchases', async () => {
      mockedPurchases.list.mockResolvedValue([
        {
          id: 'b0000000-0000-0000-0000-000000000001',
          weddingId: WEDDING_ID,
          userId: 'db-user-id',
          stripeSessionId: null,
          stripePaymentIntentId: null,
          amount: '49.99',
          currency: 'usd',
          status: 'completed',
          completedAt: new Date(),
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/purchases?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].amount).toBe('49.99')
    })
  })

  describe('Referrals', () => {
    it('should list referrals for user', async () => {
      mockedReferrals.listByUser.mockResolvedValue([
        {
          id: 'c0000000-0000-0000-0000-000000000001',
          referrerUserId: 'db-user-id',
          referralCode: 'WEDD123',
          referredEmail: null,
          referredUserId: null,
          isConverted: false,
          convertedAt: null,
          rewardGranted: false,
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request('/referrals', { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].referralCode).toBe('WEDD123')
    })

    it('should create a referral code', async () => {
      mockedReferrals.create.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000002',
        referrerUserId: 'db-user-id',
        referralCode: 'LOVE2026',
        referredEmail: null,
        referredUserId: null,
        isConverted: false,
        convertedAt: null,
        rewardGranted: false,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/referrals', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ referralCode: 'LOVE2026' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.referralCode).toBe('LOVE2026')
    })

    it('should redeem a referral code', async () => {
      mockedReferrals.redeem.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000001',
        referrerUserId: 'other-user-id',
        referralCode: 'WEDD123',
        referredEmail: 'test@example.com',
        referredUserId: 'db-user-id',
        isConverted: true,
        convertedAt: new Date(),
        rewardGranted: false,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/referrals/redeem', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ referralCode: 'WEDD123', email: 'test@example.com' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isConverted).toBe(true)
    })

    it('should return 400 for invalid referral code', async () => {
      mockedReferrals.redeem.mockResolvedValue(null)
      const app = createApp()
      const res = await app.request('/referrals/redeem', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ referralCode: 'BAD_CODE', email: 'test@example.com' }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('Contact Form (public)', () => {
    it('should submit a contact form', async () => {
      mockedContact.create.mockResolvedValue({
        id: 'd0000000-0000-0000-0000-000000000001',
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question',
        message: 'Hello!',
        isRead: false,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Question',
          message: 'Hello!',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should reject invalid contact form', async () => {
      const app = createApp()
      const res = await app.request('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John' }),
      })
      expect(res.status).toBe(400)
    })
  })
})
