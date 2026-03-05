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

vi.mock('../services/email-campaigns.js', () => ({
  emailCampaignService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getRecipients: vi.fn(),
  },
  announcementService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

import { emailCampaignsRoute, announcementsRoute } from './email-campaigns.js'
import { emailCampaignService, announcementService } from '../services/email-campaigns.js'

const mockedCampaignService = vi.mocked(emailCampaignService)
const mockedAnnouncementService = vi.mocked(announcementService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const CAMPAIGN_ID = 'b0000000-0000-0000-0000-000000000001'
const ANNOUNCEMENT_ID = 'c0000000-0000-0000-0000-000000000001'

function createCampaignApp() {
  const app = new Hono()
  app.route('/email-campaigns', emailCampaignsRoute)
  return app
}

function createAnnouncementApp() {
  const app = new Hono()
  app.route('/announcements', announcementsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Email Campaign Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /email-campaigns', () => {
    it('should list campaigns', async () => {
      mockedCampaignService.list.mockResolvedValue([
        { id: CAMPAIGN_ID, weddingId: WEDDING_ID, subject: 'Save the Date', body: '<p>Coming soon!</p>',
          templateType: 'save_the_date', status: 'draft', scheduledAt: null, sentAt: null,
          recipientFilter: null, recipientCount: 0, openCount: 0, clickCount: 0,
          createdAt: new Date(), updatedAt: new Date() },
      ] as never)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].subject).toBe('Save the Date')
    })
  })

  describe('GET /email-campaigns/:id', () => {
    it('should get a campaign by id', async () => {
      mockedCampaignService.getById.mockResolvedValue({
        id: CAMPAIGN_ID, weddingId: WEDDING_ID, subject: 'Save the Date', body: '<p>Coming soon!</p>',
        templateType: 'save_the_date', status: 'draft', scheduledAt: null, sentAt: null,
        recipientFilter: null, recipientCount: 0, openCount: 0, clickCount: 0,
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.subject).toBe('Save the Date')
    })

    it('should return 404 for non-existent campaign', async () => {
      mockedCampaignService.getById.mockResolvedValue(null)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /email-campaigns', () => {
    it('should create a campaign', async () => {
      mockedCampaignService.create.mockResolvedValue({
        id: CAMPAIGN_ID, weddingId: WEDDING_ID, subject: 'Wedding Invitation', body: '<p>You are invited!</p>',
        templateType: 'invitation', status: 'draft', scheduledAt: null, sentAt: null,
        recipientFilter: null, recipientCount: 0, openCount: 0, clickCount: 0,
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createCampaignApp()
      const res = await app.request('/email-campaigns', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, subject: 'Wedding Invitation', body: '<p>You are invited!</p>', templateType: 'invitation' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.subject).toBe('Wedding Invitation')
    })

    it('should return 400 for invalid body', async () => {
      const app = createCampaignApp()
      const res = await app.request('/email-campaigns', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /email-campaigns/:id', () => {
    it('should update a campaign', async () => {
      mockedCampaignService.update.mockResolvedValue({
        id: CAMPAIGN_ID, weddingId: WEDDING_ID, subject: 'Updated Subject', body: '<p>Updated!</p>',
        templateType: 'custom', status: 'draft', scheduledAt: null, sentAt: null,
        recipientFilter: null, recipientCount: 0, openCount: 0, clickCount: 0,
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ subject: 'Updated Subject' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.subject).toBe('Updated Subject')
    })

    it('should return 404 for non-existent campaign', async () => {
      mockedCampaignService.update.mockResolvedValue(null)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ subject: 'Nope' }),
      })
      expect(res.status).toBe(404)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ subject: 'Test' }),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('DELETE /email-campaigns/:id', () => {
    it('should delete a campaign', async () => {
      mockedCampaignService.delete.mockResolvedValue(true as never)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 for non-existent campaign', async () => {
      mockedCampaignService.delete.mockResolvedValue(false as never)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('GET /email-campaigns/:id/recipients', () => {
    it('should list recipients', async () => {
      mockedCampaignService.getRecipients.mockResolvedValue([
        { id: 'd0000000-0000-0000-0000-000000000001', campaignId: CAMPAIGN_ID,
          email: 'guest@example.com', name: 'Guest One', guestId: null,
          sentAt: null, openedAt: null, clickedAt: null, createdAt: new Date() },
      ] as never)

      const app = createCampaignApp()
      const res = await app.request(`/email-campaigns/${CAMPAIGN_ID}/recipients`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].email).toBe('guest@example.com')
    })
  })
})

describe('Announcement Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /announcements', () => {
    it('should list announcements', async () => {
      mockedAnnouncementService.list.mockResolvedValue([
        { id: ANNOUNCEMENT_ID, weddingId: WEDDING_ID, title: 'Venue Change',
          content: 'We changed the venue!', isPublished: true, publishedAt: new Date(),
          createdAt: new Date(), updatedAt: new Date() },
      ] as never)

      const app = createAnnouncementApp()
      const res = await app.request(`/announcements?weddingId=${WEDDING_ID}`, { method: 'GET', headers: authHeaders() })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Venue Change')
    })
  })

  describe('POST /announcements', () => {
    it('should create an announcement', async () => {
      mockedAnnouncementService.create.mockResolvedValue({
        id: ANNOUNCEMENT_ID, weddingId: WEDDING_ID, title: 'Welcome!',
        content: 'We are getting married!', isPublished: false, publishedAt: null,
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createAnnouncementApp()
      const res = await app.request('/announcements', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, title: 'Welcome!', content: 'We are getting married!' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Welcome!')
    })

    it('should return 400 for invalid body', async () => {
      const app = createAnnouncementApp()
      const res = await app.request('/announcements', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /announcements/:id', () => {
    it('should update an announcement', async () => {
      mockedAnnouncementService.update.mockResolvedValue({
        id: ANNOUNCEMENT_ID, weddingId: WEDDING_ID, title: 'Updated Title',
        content: 'Updated content', isPublished: true, publishedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      } as never)

      const app = createAnnouncementApp()
      const res = await app.request(`/announcements/${ANNOUNCEMENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ title: 'Updated Title' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Updated Title')
    })

    it('should return 404 for non-existent announcement', async () => {
      mockedAnnouncementService.update.mockResolvedValue(null)

      const app = createAnnouncementApp()
      const res = await app.request(`/announcements/${ANNOUNCEMENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ title: 'Nope' }),
      })
      expect(res.status).toBe(404)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createAnnouncementApp()
      const res = await app.request(`/announcements/${ANNOUNCEMENT_ID}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ title: 'Test' }),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('DELETE /announcements/:id', () => {
    it('should delete an announcement', async () => {
      mockedAnnouncementService.delete.mockResolvedValue(true as never)

      const app = createAnnouncementApp()
      const res = await app.request(`/announcements/${ANNOUNCEMENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 for non-existent announcement', async () => {
      mockedAnnouncementService.delete.mockResolvedValue(false as never)

      const app = createAnnouncementApp()
      const res = await app.request(`/announcements/${ANNOUNCEMENT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createAnnouncementApp()
      const res = await app.request(`/announcements/${ANNOUNCEMENT_ID}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
