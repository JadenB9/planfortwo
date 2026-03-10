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

vi.mock('../services/households.js', () => ({
  householdService: {
    listHouseholds: vi.fn(),
    getHousehold: vi.fn(),
    createHousehold: vi.fn(),
    updateHousehold: vi.fn(),
    deleteHousehold: vi.fn(),
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

import { householdsRoute } from './households.js'
import { householdService } from '../services/households.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedHouseholdService = vi.mocked(householdService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const HOUSEHOLD_ID = 'h0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/households', householdsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Household Routes', () => {
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
    mockedHouseholdService.getHousehold.mockResolvedValue({
      id: HOUSEHOLD_ID,
      weddingId: WEDDING_ID,
      name: 'The Smiths',
      rsvpCode: 'SMITHS2026',
      guests: [],
    } as never)
  })

  describe('GET /households', () => {
    it('should list households with guests', async () => {
      const mockHouseholds = [
        {
          id: HOUSEHOLD_ID,
          name: 'The Smiths',
          weddingId: WEDDING_ID,
          rsvpCode: 'SMITHS2026',
          guests: [{ id: 'g-1', firstName: 'Alice', lastName: 'Smith' }],
        },
      ]
      mockedHouseholdService.listHouseholds.mockResolvedValue(mockHouseholds as never)

      const app = createApp()
      const res = await app.request(`/households?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('The Smiths')
    })
  })

  describe('GET /households/:id', () => {
    it('should return a household with guests', async () => {
      const mockHousehold = {
        id: HOUSEHOLD_ID,
        weddingId: WEDDING_ID,
        name: 'The Smiths',
        rsvpCode: 'SMITHS2026',
        guests: [],
      }
      mockedHouseholdService.getHousehold.mockResolvedValue(mockHousehold as never)

      const app = createApp()
      const res = await app.request(`/households/${HOUSEHOLD_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(HOUSEHOLD_ID)
    })

    it('should return 404 when household not found', async () => {
      mockedHouseholdService.getHousehold.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/households/${HOUSEHOLD_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('HOUSEHOLD_NOT_FOUND')
    })
  })

  describe('POST /households', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      name: 'The Smiths',
    }

    it('should create a household', async () => {
      mockedHouseholdService.createHousehold.mockResolvedValue({
        id: HOUSEHOLD_ID,
        weddingId: WEDDING_ID,
        name: 'The Smiths',
        rsvpCode: 'SMITHS2026',
      } as never)

      const app = createApp()
      const res = await app.request('/households', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('The Smiths')
      expect(body.data.rsvpCode).toBe('SMITHS2026')
    })

    it('should return 401 without auth', async () => {
      const app = createApp()
      const res = await app.request('/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /households/:id', () => {
    it('should update a household', async () => {
      mockedHouseholdService.updateHousehold.mockResolvedValue({
        id: HOUSEHOLD_ID,
        name: 'The Jones Family',
      } as never)

      const app = createApp()
      const res = await app.request(`/households/${HOUSEHOLD_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'The Jones Family' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('The Jones Family')
    })

    it('should return 404 when household not found on update', async () => {
      mockedHouseholdService.updateHousehold.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/households/${HOUSEHOLD_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'Non-existent' }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('HOUSEHOLD_NOT_FOUND')
    })
  })

  describe('DELETE /households/:id', () => {
    it('should delete a household', async () => {
      mockedHouseholdService.deleteHousehold.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/households/${HOUSEHOLD_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 400 without weddingId', async () => {
      const app = createApp()
      const res = await app.request(`/households/${HOUSEHOLD_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
