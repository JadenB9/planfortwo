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
    findByUserId: vi.fn().mockResolvedValue({
      id: 'a0000000-0000-0000-0000-000000000001',
      timelineTemplate: '12-month',
      date: '2026-09-15T00:00:00.000Z',
      tier: 'full',
    }),
  },
}))

vi.mock('../services/guests.js', () => ({
  guestService: {
    listGuests: vi.fn(),
    getGuest: vi.fn(),
    createGuest: vi.fn(),
    updateGuest: vi.fn(),
    deleteGuest: vi.fn(),
    getStats: vi.fn(),
    exportCsv: vi.fn(),
    bulkImportCsv: vi.fn(),
    setTagsForGuest: vi.fn(),
    getGuestCount: vi.fn(),
  },
}))

vi.mock('../services/guest-tags.js', () => ({
  guestTagService: {
    removeTag: vi.fn(),
    listTags: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
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

// Mock @planfortwo/db for requireGuestLimit middleware
vi.mock('@planfortwo/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ cnt: 0 }]),
      }),
    }),
  },
  guests: { weddingId: 'weddingId', id: 'id' },
  guestTags: {},
  guestTagAssignments: {},
  households: {},
  eq: vi.fn(),
  count: vi.fn(),
}))

import { guestsRoute } from './guests.js'
import { guestService } from '../services/guests.js'
import { featureService } from '../services/features.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedGuestService = vi.mocked(guestService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const GUEST_ID = 'b0000000-0000-0000-0000-000000000001'
const TAG_ID = 'c0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/guests', guestsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

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

describe('Guest Routes', () => {
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
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
    mockedGuestService.getGuest.mockResolvedValue({
      id: GUEST_ID,
      weddingId: WEDDING_ID,
      firstName: 'Alice',
      lastName: 'Smith',
      tags: [],
      household: null,
    } as never)
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /guests', () => {
    it('should return paginated guest list', async () => {
      const mockResult = {
        data: [{ id: GUEST_ID, firstName: 'Alice', lastName: 'Smith', weddingId: WEDDING_ID }],
        total: 1,
        page: 1,
        pageSize: 25,
        hasMore: false,
      }
      mockedGuestService.listGuests.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(`/guests?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
    })

    it('should filter guests by rsvpStatus', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 25,
        hasMore: false,
      }
      mockedGuestService.listGuests.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(`/guests?weddingId=${WEDDING_ID}&rsvpStatus=accepted`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      expect(mockedGuestService.listGuests).toHaveBeenCalledWith(
        expect.objectContaining({ rsvpStatus: 'accepted' }),
      )
    })
  })

  describe('GET /guests/stats', () => {
    it('should return guest statistics', async () => {
      const mockStats = {
        totalGuests: 50,
        adults: 40,
        children: 10,
        plusOnes: 5,
        confirmedPlusOnes: 3,
        rsvpAccepted: 30,
        rsvpDeclined: 5,
        rsvpPending: 10,
        rsvpMaybe: 5,
        dietarySummary: {
          vegetarian: 3,
          vegan: 1,
          glutenFree: 2,
          kosher: 0,
          halal: 0,
          withAllergies: 1,
        },
        mealChoiceSummary: { chicken: 20, beef: 15, fish: 10 },
      }
      mockedGuestService.getStats.mockResolvedValue(mockStats as never)

      const app = createApp()
      const res = await app.request(`/guests/stats?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.totalGuests).toBe(50)
      expect(body.data.rsvpAccepted).toBe(30)
    })
  })

  describe('GET /guests/export', () => {
    it('should export CSV when full tier', async () => {
      mockedGuestService.exportCsv.mockResolvedValue('firstName,lastName\nAlice,Smith')

      const app = createApp()
      const res = await app.request(`/guests/export?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/csv')
    })
  })

  describe('GET /guests/:id', () => {
    it('should return a single guest', async () => {
      const mockGuest = {
        id: GUEST_ID,
        weddingId: WEDDING_ID,
        firstName: 'Alice',
        lastName: 'Smith',
        tags: [],
        household: null,
      }
      mockedGuestService.getGuest.mockResolvedValue(mockGuest as never)

      const app = createApp()
      const res = await app.request(`/guests/${GUEST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(GUEST_ID)
      expect(body.data.firstName).toBe('Alice')
    })

    it('should return 404 when guest not found', async () => {
      mockedGuestService.getGuest.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/guests/${GUEST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('GUEST_NOT_FOUND')
    })
  })

  describe('POST /guests', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      firstName: 'Alice',
      lastName: 'Smith',
    }

    it('should create a guest', async () => {
      mockedGuestService.createGuest.mockResolvedValue({
        id: GUEST_ID,
        ...validBody,
      } as never)

      const app = createApp()
      const res = await app.request(`/guests?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.firstName).toBe('Alice')
    })

    it('should return 401 without auth', async () => {
      const app = createApp()
      const res = await app.request('/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(401)
    })

    it('should return 403 when guest limit reached', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue({
        ...FREE_GATES,
        maxGuests: 15,
      })

      // Mock DB to return count at limit
      const { db } = await import('@planfortwo/db')
      ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ cnt: 15 }]),
        }),
      })

      const app = createApp()
      const res = await app.request(`/guests?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('GUEST_LIMIT_REACHED')
    })
  })

  describe('PUT /guests/:id', () => {
    const updateBody = { firstName: 'Updated' }

    it('should update a guest on full tier', async () => {
      mockedGuestService.updateGuest.mockResolvedValue({
        id: GUEST_ID,
        firstName: 'Updated',
      } as never)

      const app = createApp()
      const res = await app.request(`/guests/${GUEST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateBody),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.firstName).toBe('Updated')
    })
  })

  describe('DELETE /guests/:id', () => {
    it('should delete a guest on full tier', async () => {
      mockedGuestService.deleteGuest.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/guests/${GUEST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })

  describe('POST /guests/bulk-import', () => {
    it('should bulk import CSV on full tier', async () => {
      mockedGuestService.bulkImportCsv.mockResolvedValue({
        imported: 3,
        skipped: 0,
        errors: [],
      } as never)

      const app = createApp()
      const res = await app.request(`/guests/bulk-import?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          csvContent: 'firstName,lastName\nAlice,Smith\nBob,Jones\nCarol,White',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.imported).toBe(3)
    })
  })

  describe('POST /guests/:id/tags', () => {
    it('should assign tags to a guest', async () => {
      mockedGuestService.setTagsForGuest.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/guests/${GUEST_ID}/tags?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tagIds: [TAG_ID] }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })

  describe('DELETE /guests/:id/tags/:tagId', () => {
    it('should remove a tag from a guest', async () => {
      const app = createApp()
      const res = await app.request(`/guests/${GUEST_ID}/tags/${TAG_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })
})
