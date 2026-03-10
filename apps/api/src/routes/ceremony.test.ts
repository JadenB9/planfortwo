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

vi.mock('../services/ceremony.js', () => ({
  ceremonyService: {
    listOutlines: vi.fn(),
    createOutline: vi.fn(),
    updateOutline: vi.fn(),
    deleteOutline: vi.fn(),
    getVow: vi.fn(),
    upsertVow: vi.fn(),
    listProcessional: vi.fn(),
    createProcessionalEntry: vi.fn(),
    updateProcessionalEntry: vi.fn(),
    deleteProcessionalEntry: vi.fn(),
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

import { ceremonyRoute } from './ceremony.js'
import { ceremonyService } from '../services/ceremony.js'

const mockedService = vi.mocked(ceremonyService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const OUTLINE_ID = 'b0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/ceremony', ceremonyRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Ceremony Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /ceremony/outlines', () => {
    it('should list ceremony outlines', async () => {
      const mockOutlines = [
        {
          id: OUTLINE_ID,
          weddingId: WEDDING_ID,
          moment: 'processional',
          title: 'Bride entrance',
          description: null,
          duration: 5,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockedService.listOutlines.mockResolvedValue(mockOutlines as never)

      const app = createApp()
      const res = await app.request(`/ceremony/outlines?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Bride entrance')
    })
  })

  describe('POST /ceremony/outlines', () => {
    it('should create a ceremony outline', async () => {
      mockedService.createOutline.mockResolvedValue({
        id: OUTLINE_ID,
        weddingId: WEDDING_ID,
        moment: 'vows',
        title: 'Exchange vows',
        description: null,
        duration: 10,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/ceremony/outlines?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, moment: 'vows', title: 'Exchange vows' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Exchange vows')
    })

    it('should reject invalid moment', async () => {
      const app = createApp()
      const res = await app.request(`/ceremony/outlines?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, moment: 'invalid', title: 'Test' }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /ceremony/outlines/:id', () => {
    it('should update a ceremony outline', async () => {
      mockedService.updateOutline.mockResolvedValue({
        id: OUTLINE_ID,
        weddingId: WEDDING_ID,
        moment: 'vows',
        title: 'Updated',
        description: null,
        duration: 15,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/ceremony/outlines/${OUTLINE_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: 'Updated', duration: 15 }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Updated')
    })

    it('should return 404 if not found', async () => {
      mockedService.updateOutline.mockResolvedValue(null)
      const app = createApp()
      const res = await app.request(`/ceremony/outlines/${OUTLINE_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: 'Updated' }),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /ceremony/outlines/:id', () => {
    it('should delete a ceremony outline', async () => {
      mockedService.deleteOutline.mockResolvedValue({ id: OUTLINE_ID } as never)
      const app = createApp()
      const res = await app.request(`/ceremony/outlines/${OUTLINE_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })

    it('should return 404 if not found', async () => {
      mockedService.deleteOutline.mockResolvedValue(null)
      const app = createApp()
      const res = await app.request(`/ceremony/outlines/${OUTLINE_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('GET /ceremony/vows', () => {
    it('should get vow workspace for current user', async () => {
      mockedService.getVow.mockResolvedValue({
        id: 'e0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        userId: 'db-user-id',
        content: 'My dearest...',
        isRevealed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/ceremony/vows?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.content).toBe('My dearest...')
    })
  })

  describe('PUT /ceremony/vows', () => {
    it('should upsert vow content', async () => {
      mockedService.upsertVow.mockResolvedValue({
        id: 'e0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        userId: 'db-user-id',
        content: 'Updated vows',
        isRevealed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/ceremony/vows?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ content: 'Updated vows' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.content).toBe('Updated vows')
    })
  })

  describe('Processional', () => {
    it('should list processional entries', async () => {
      mockedService.listProcessional.mockResolvedValue([
        {
          id: 'f0000000-0000-0000-0000-000000000001',
          weddingId: WEDDING_ID,
          name: 'Best Man',
          role: 'Best Man',
          sortOrder: 0,
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/ceremony/processional?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })

    it('should create a processional entry', async () => {
      mockedService.createProcessionalEntry.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        name: 'Flower Girl',
        role: 'Flower Girl',
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/ceremony/processional?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'Flower Girl', role: 'Flower Girl' }),
      })
      expect(res.status).toBe(201)
    })

    it('should update a processional entry', async () => {
      mockedService.updateProcessionalEntry.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        name: 'Updated',
        role: null,
        sortOrder: 1,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/ceremony/processional/f0000000-0000-0000-0000-000000000001?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ name: 'Updated', sortOrder: 1 }),
        },
      )
      expect(res.status).toBe(200)
    })

    it('should delete a processional entry', async () => {
      mockedService.deleteProcessionalEntry.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001',
      } as never)
      const app = createApp()
      const res = await app.request(
        `/ceremony/processional/f0000000-0000-0000-0000-000000000001?weddingId=${WEDDING_ID}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        },
      )
      expect(res.status).toBe(200)
    })
  })
})
