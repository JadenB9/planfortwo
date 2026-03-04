import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    }),
    findById: vi.fn().mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    }),
  },
}))

vi.mock('../services/weddings.js', () => ({
  weddingService: {
    verifyMembership: vi.fn().mockResolvedValue({
      id: 'member-1', weddingId: 'a0000000-0000-0000-0000-000000000001',
      userId: 'db-user-id', role: 'owner', joinedAt: new Date(),
    }),
    findByUserId: vi.fn(),
  },
}))

vi.mock('../services/post-wedding.js', () => ({
  thankYouService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  nameChangeService: {
    list: vi.fn(),
    create: vi.fn(),
    toggleComplete: vi.fn(),
    delete: vi.fn(),
  },
  vendorReviewService: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  notificationPrefService: {
    get: vi.fn(),
    upsert: vi.fn(),
  },
}))

vi.mock('../services/features.js', () => ({
  featureService: {
    getFeatures: vi.fn().mockResolvedValue({
      tier: 'full', canAddTasks: true, canEditChecklist: true, canDeleteTasks: true,
      canReorderTasks: true, canCustomizeCategories: true, canAddNotes: true,
      canAddAttachments: true, maxGuests: null, canEditGuests: true,
      canDeleteGuests: true, canBulkImport: true, canRsvp: true,
      canSeatingChart: true, canVendorManagement: true, canCustomDomain: true,
      canDataExport: true, canBudgetCategories: true, canBudgetExpenses: true,
      canBudgetAnalytics: true, canBudgetExport: true, canPaymentSchedule: true,
      canWebsiteBuilder: true, canWebsiteAnalytics: true, canWebsiteCustomSections: true,
    }),
  },
}))

import { thankYouRoute, nameChangeRoute, vendorReviewsRoute, notificationPrefsRoute } from './post-wedding.js'
import { thankYouService, nameChangeService, vendorReviewService, notificationPrefService } from '../services/post-wedding.js'

const mockedThankYou = vi.mocked(thankYouService)
const mockedNameChange = vi.mocked(nameChangeService)
const mockedReviews = vi.mocked(vendorReviewService)
const mockedNotifPrefs = vi.mocked(notificationPrefService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const NOTE_ID = 'b0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/thank-you', thankYouRoute)
  app.route('/name-change', nameChangeRoute)
  app.route('/vendor-reviews', vendorReviewsRoute)
  app.route('/notification-prefs', notificationPrefsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Post-Wedding Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('Thank You Notes', () => {
    it('should list thank you notes', async () => {
      mockedThankYou.list.mockResolvedValue([
        { id: NOTE_ID, weddingId: WEDDING_ID, recipientName: 'Aunt Mary', status: 'not_started',
          guestId: null, giftId: null, recipientEmail: null, recipientAddress: null,
          message: null, sentAt: null, createdAt: new Date(), updatedAt: new Date() },
      ] as never)

      const app = createApp()
      const res = await app.request(`/thank-you?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].recipientName).toBe('Aunt Mary')
    })

    it('should create a thank you note', async () => {
      mockedThankYou.create.mockResolvedValue({
        id: NOTE_ID, weddingId: WEDDING_ID, recipientName: 'Uncle Bob',
        status: 'not_started', guestId: null, giftId: null, recipientEmail: null,
        recipientAddress: null, message: null, sentAt: null,
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/thank-you', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, recipientName: 'Uncle Bob' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.recipientName).toBe('Uncle Bob')
    })

    it('should update a thank you note status', async () => {
      mockedThankYou.update.mockResolvedValue({
        id: NOTE_ID, weddingId: WEDDING_ID, recipientName: 'Aunt Mary',
        status: 'sent', guestId: null, giftId: null, recipientEmail: null,
        recipientAddress: null, message: 'Thank you!', sentAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/thank-you/${NOTE_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status: 'sent', message: 'Thank you!' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.status).toBe('sent')
    })

    it('should delete a thank you note', async () => {
      mockedThankYou.delete.mockResolvedValue(true as never)
      const app = createApp()
      const res = await app.request(`/thank-you/${NOTE_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Name Change Tasks', () => {
    it('should list name change tasks', async () => {
      mockedNameChange.list.mockResolvedValue([
        { id: 'c0000000-0000-0000-0000-000000000001', weddingId: WEDDING_ID,
          institution: 'Social Security', description: 'Apply for new SSN card',
          documentsRequired: 'Marriage certificate', isCompleted: false,
          completedAt: null, sortOrder: 0, createdAt: new Date() },
      ] as never)

      const app = createApp()
      const res = await app.request(`/name-change?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].institution).toBe('Social Security')
    })

    it('should toggle name change task completion', async () => {
      mockedNameChange.toggleComplete.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000001', weddingId: WEDDING_ID,
        institution: 'DMV', isCompleted: true, completedAt: new Date(),
        description: null, documentsRequired: null, sortOrder: 0, createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/name-change/c0000000-0000-0000-0000-000000000001/toggle?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.isCompleted).toBe(true)
    })
  })

  describe('Vendor Reviews', () => {
    it('should create a vendor review', async () => {
      mockedReviews.create.mockResolvedValue({
        id: 'd0000000-0000-0000-0000-000000000001', weddingId: WEDDING_ID,
        vendorId: 'e0000000-0000-0000-0000-000000000001', rating: 5,
        reviewText: 'Amazing photographer!', isPublished: false, createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/vendor-reviews', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          vendorId: 'e0000000-0000-0000-0000-000000000001',
          rating: 5,
          reviewText: 'Amazing photographer!',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.rating).toBe(5)
    })
  })

  describe('Notification Preferences', () => {
    it('should get notification preferences', async () => {
      mockedNotifPrefs.get.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001', userId: 'db-user-id',
        weddingId: WEDDING_ID, emailRsvp: true, emailPaymentReminder: true,
        emailTaskDue: true, emailWeeklySummary: false, digestFrequency: 'daily',
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/notification-prefs?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.emailWeeklySummary).toBe(false)
    })

    it('should update notification preferences', async () => {
      mockedNotifPrefs.upsert.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001', userId: 'db-user-id',
        weddingId: WEDDING_ID, emailRsvp: true, emailPaymentReminder: false,
        emailTaskDue: true, emailWeeklySummary: true, digestFrequency: 'weekly',
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/notification-prefs?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ emailPaymentReminder: false, digestFrequency: 'weekly' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.digestFrequency).toBe('weekly')
    })
  })
})
