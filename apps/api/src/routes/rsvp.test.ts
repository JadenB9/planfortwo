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

vi.mock('../services/rsvp.js', () => ({
  rsvpService: {
    lookupByToken: vi.fn(),
    lookupByCode: vi.fn(),
    lookupByName: vi.fn(),
    lookupByGuestId: vi.fn(),
    submitRsvp: vi.fn(),
    submitBatchRsvp: vi.fn(),
    isDeadlinePassed: vi.fn(),
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
    }),
  },
}))

// Mock @planfortwo/db for rsvp route inline DB queries
vi.mock('@planfortwo/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  }
  return {
    db: mockDb,
    guests: {
      id: 'id',
      weddingId: 'weddingId',
      rsvpToken: 'rsvpToken',
      rsvpStatus: 'rsvpStatus',
      isChild: 'isChild',
      hasPlusOne: 'hasPlusOne',
      plusOneConfirmed: 'plusOneConfirmed',
      dietary: 'dietary',
      mealChoice: 'mealChoice',
      householdId: 'householdId',
    },
    websiteConfigs: {
      weddingId: 'weddingId',
      subdomain: 'subdomain',
    },
    households: {},
    weddings: {},
    eq: vi.fn(),
  }
})

import { rsvpRoute } from './rsvp.js'
import { rsvpService } from '../services/rsvp.js'
import { db } from '@planfortwo/db'

const mockedRsvpService = vi.mocked(rsvpService)
const mockedDb = vi.mocked(db)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const GUEST_ID = 'b0000000-0000-0000-0000-000000000001'
const GUEST_ID_2 = 'b0000000-0000-0000-0000-000000000002'
const RSVP_TOKEN = 'tok_abc123'
const RSVP_CODE = 'SMITHS2026'
const SLUG = 'smith-wedding'

function createApp() {
  const app = new Hono()
  app.route('/rsvp', rsvpRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

function mockSlugResolution() {
  ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ weddingId: WEDDING_ID }]),
      }),
    }),
  })
}

describe('RSVP Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /rsvp/lookup (public)', () => {
    it('should lookup by token', async () => {
      const mockResult = {
        guest: { id: GUEST_ID, firstName: 'Alice', lastName: 'Smith' },
        household: null,
        householdGuests: [],
        weddingName: 'Smith Wedding',
        weddingDate: '2026-09-15',
        rsvpDeadline: '2026-08-01',
        isExpired: false,
      }
      mockedRsvpService.lookupByToken.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(`/rsvp/lookup?token=${RSVP_TOKEN}`, {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.guest.firstName).toBe('Alice')
      expect(body.data.isExpired).toBe(false)
    })

    it('should lookup by code', async () => {
      const mockResult = {
        guest: { id: GUEST_ID, firstName: 'Alice', lastName: 'Smith' },
        household: { id: 'h-1', name: 'The Smiths', rsvpCode: RSVP_CODE },
        householdGuests: [],
        weddingName: 'Smith Wedding',
        weddingDate: '2026-09-15',
        rsvpDeadline: '2026-08-01',
        isExpired: false,
      }
      mockedRsvpService.lookupByCode.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request(`/rsvp/lookup?code=${RSVP_CODE}`, {
        method: 'GET',
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.household.rsvpCode).toBe(RSVP_CODE)
    })

    it('should return 404 for invalid token', async () => {
      mockedRsvpService.lookupByToken.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/rsvp/lookup?token=bad-token', {
        method: 'GET',
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('GUEST_NOT_FOUND')
    })
  })

  describe('POST /rsvp/lookup-by-name (public)', () => {
    it('should return single result when one guest matches', async () => {
      mockSlugResolution()
      const mockResult = {
        type: 'single' as const,
        result: {
          guest: { id: GUEST_ID, firstName: 'Alice', lastName: 'Smith' },
          household: null,
          householdGuests: [],
          weddingName: 'Smith Wedding',
          weddingDate: '2026-09-15',
          rsvpDeadline: '2026-08-01',
          isExpired: false,
        },
      }
      mockedRsvpService.lookupByName.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request('/rsvp/lookup-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          firstName: 'Alice',
          lastName: 'Smith',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.type).toBe('single')
      expect(body.data.result.guest.firstName).toBe('Alice')
    })

    it('should return multiple guests when several match', async () => {
      mockSlugResolution()
      const mockResult = {
        type: 'multiple' as const,
        guests: [
          { id: GUEST_ID, firstName: 'Alice', lastName: 'Smith' },
          { id: GUEST_ID_2, firstName: 'Alice', lastName: 'Smith' },
        ],
      }
      mockedRsvpService.lookupByName.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request('/rsvp/lookup-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          firstName: 'Alice',
          lastName: 'Smith',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.type).toBe('multiple')
      expect(body.data.guests).toHaveLength(2)
    })

    it('should return 404 when no guests match', async () => {
      mockSlugResolution()
      const mockResult = { type: 'none' as const }
      mockedRsvpService.lookupByName.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request('/rsvp/lookup-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: SLUG,
          firstName: 'Nobody',
          lastName: 'Here',
        }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
      expect(body.error).toBe('Invitation not found')
    })
  })

  describe('POST /rsvp/lookup-by-guest-id (public)', () => {
    it('should return guest lookup result', async () => {
      mockSlugResolution()
      mockedRsvpService.isDeadlinePassed.mockResolvedValue(false)
      const mockResult = {
        guest: { id: GUEST_ID, firstName: 'Alice', lastName: 'Smith' },
        household: null,
        householdGuests: [],
        weddingName: 'Smith Wedding',
        weddingDate: '2026-09-15',
        rsvpDeadline: '2026-08-01',
        isExpired: false,
      }
      mockedRsvpService.lookupByGuestId.mockResolvedValue(mockResult as never)

      const app = createApp()
      const res = await app.request('/rsvp/lookup-by-guest-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          slug: SLUG,
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.guest.firstName).toBe('Alice')
    })

    it('should return 404 when guest not found', async () => {
      mockSlugResolution()
      mockedRsvpService.isDeadlinePassed.mockResolvedValue(false)
      mockedRsvpService.lookupByGuestId.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/rsvp/lookup-by-guest-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          slug: SLUG,
        }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })

    it('should return 410 when deadline has passed', async () => {
      mockSlugResolution()
      mockedRsvpService.isDeadlinePassed.mockResolvedValue(true)

      const app = createApp()
      const res = await app.request('/rsvp/lookup-by-guest-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          slug: SLUG,
        }),
      })

      expect(res.status).toBe(410)
      const body = await res.json()
      expect(body.code).toBe('RSVP_EXPIRED')
    })
  })

  describe('POST /rsvp/submit (public)', () => {
    it('should submit RSVP with valid token', async () => {
      // Mock db.select chain for guest lookup — now returns rsvpToken
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ weddingId: WEDDING_ID, rsvpToken: RSVP_TOKEN }]),
          }),
        }),
      })

      const mockUpdated = {
        id: GUEST_ID,
        rsvpStatus: 'accepted',
        mealChoice: 'chicken',
      }
      mockedRsvpService.submitRsvp.mockResolvedValue(mockUpdated as never)

      const app = createApp()
      const res = await app.request(`/rsvp/submit?token=${RSVP_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          rsvpStatus: 'accepted',
          mealChoice: 'chicken',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.rsvpStatus).toBe('accepted')
    })

    it('should return 403 without rsvp token', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ weddingId: WEDDING_ID, rsvpToken: RSVP_TOKEN }]),
          }),
        }),
      })

      const app = createApp()
      const res = await app.request('/rsvp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          rsvpStatus: 'accepted',
        }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('UNAUTHORIZED')
    })

    it('should return 410 when deadline passed', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ weddingId: WEDDING_ID, rsvpToken: RSVP_TOKEN }]),
          }),
        }),
      })

      mockedRsvpService.submitRsvp.mockRejectedValue(new Error('RSVP deadline has passed'))

      const app = createApp()
      const res = await app.request(`/rsvp/submit?token=${RSVP_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          rsvpStatus: 'accepted',
        }),
      })

      expect(res.status).toBe(410)
      const body = await res.json()
      expect(body.code).toBe('RSVP_EXPIRED')
    })

    it('should return 404 when guest not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const app = createApp()
      const res = await app.request(`/rsvp/submit?token=${RSVP_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: GUEST_ID,
          rsvpStatus: 'accepted',
        }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('GUEST_NOT_FOUND')
    })
  })

  describe('POST /rsvp/submit-batch (public)', () => {
    it('should batch submit RSVPs with valid token', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([
                { weddingId: WEDDING_ID, rsvpToken: RSVP_TOKEN, householdId: 'h-1' },
              ]),
          }),
        }),
      })

      const mockUpdated = [
        { id: GUEST_ID, rsvpStatus: 'accepted' },
        { id: GUEST_ID_2, rsvpStatus: 'declined' },
      ]
      mockedRsvpService.submitBatchRsvp.mockResolvedValue(mockUpdated as never)

      const app = createApp()
      const res = await app.request(`/rsvp/submit-batch?token=${RSVP_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions: [
            { guestId: GUEST_ID, rsvpStatus: 'accepted' },
            { guestId: GUEST_ID_2, rsvpStatus: 'declined' },
          ],
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(2)
    })

    it('should return 410 when deadline passed on batch', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([
                { weddingId: WEDDING_ID, rsvpToken: RSVP_TOKEN, householdId: null },
              ]),
          }),
        }),
      })

      mockedRsvpService.submitBatchRsvp.mockRejectedValue(new Error('RSVP deadline has passed'))

      const app = createApp()
      const res = await app.request(`/rsvp/submit-batch?token=${RSVP_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions: [{ guestId: GUEST_ID, rsvpStatus: 'accepted' }],
        }),
      })

      expect(res.status).toBe(410)
      const body = await res.json()
      expect(body.code).toBe('RSVP_EXPIRED')
    })
  })

  describe('GET /rsvp/dashboard (auth required)', () => {
    it('should return 401 without auth', async () => {
      const app = createApp()
      const res = await app.request(`/rsvp/dashboard?weddingId=${WEDDING_ID}`, {
        method: 'GET',
      })

      expect(res.status).toBe(401)
    })

    it('should return dashboard stats when authenticated', async () => {
      // Mock db.select chain for the dashboard inline query
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: GUEST_ID,
              rsvpStatus: 'accepted',
              isChild: false,
              hasPlusOne: true,
              plusOneConfirmed: true,
              dietary: { vegetarian: true },
              mealChoice: 'chicken',
            },
            {
              id: 'g-2',
              rsvpStatus: 'pending',
              isChild: true,
              hasPlusOne: false,
              plusOneConfirmed: false,
              dietary: null,
              mealChoice: null,
            },
          ]),
        }),
      })

      const app = createApp()
      const res = await app.request(`/rsvp/dashboard?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.totalGuests).toBe(2)
      expect(body.data.adults).toBe(1)
      expect(body.data.children).toBe(1)
      expect(body.data.rsvpAccepted).toBe(1)
      expect(body.data.rsvpPending).toBe(1)
    })
  })
})
