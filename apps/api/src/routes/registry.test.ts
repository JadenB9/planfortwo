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

vi.mock('../services/registry.js', () => ({
  registryService: {
    listLinks: vi.fn(),
    createLink: vi.fn(),
    deleteLink: vi.fn(),
    trackClick: vi.fn(),
    listFunds: vi.fn(),
    createFund: vi.fn(),
    updateFund: vi.fn(),
    deleteFund: vi.fn(),
    addContribution: vi.fn(),
    listGifts: vi.fn(),
    createGift: vi.fn(),
    updateGift: vi.fn(),
    deleteGift: vi.fn(),
    listMoodBoards: vi.fn(),
    createMoodBoard: vi.fn(),
    deleteMoodBoard: vi.fn(),
    listBoardItems: vi.fn(),
    addBoardItem: vi.fn(),
    deleteBoardItem: vi.fn(),
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

import { registryRoute } from './registry.js'
import { registryService } from '../services/registry.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(registryService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/registry', registryRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Registry Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue({
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
    })
  })

  describe('GET /registry/links', () => {
    it('should list registry links', async () => {
      mockedService.listLinks.mockResolvedValue([
        {
          id: 'b0000000-0000-0000-0000-000000000001',
          weddingId: WEDDING_ID,
          storeName: 'Amazon',
          url: 'https://amazon.com/registry/123',
          logoUrl: null,
          clickCount: 5,
          sortOrder: 0,
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/registry/links?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].storeName).toBe('Amazon')
    })
  })

  describe('POST /registry/links', () => {
    it('should create a registry link', async () => {
      mockedService.createLink.mockResolvedValue({
        id: 'b0000000-0000-0000-0000-000000000002',
        weddingId: WEDDING_ID,
        storeName: 'Target',
        url: 'https://target.com/registry/456',
        logoUrl: null,
        clickCount: 0,
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/registry/links?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          storeName: 'Target',
          url: 'https://target.com/registry/456',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.storeName).toBe('Target')
    })
  })

  describe('POST /registry/funds', () => {
    it('should create a cash fund', async () => {
      mockedService.createFund.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        name: 'Honeymoon Fund',
        description: 'Help us travel!',
        goalAmount: 5000,
        currentAmount: 0,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/registry/funds?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          name: 'Honeymoon Fund',
          description: 'Help us travel!',
          goalAmount: 5000,
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Honeymoon Fund')
      expect(body.data.goalAmount).toBe(5000)
    })
  })

  describe('POST /registry/funds/:id/contribute', () => {
    it('should add a contribution with wedding ownership check', async () => {
      const fundId = 'c0000000-0000-0000-0000-000000000001'
      mockedService.addContribution.mockResolvedValue({
        id: 'd0000000-0000-0000-0000-000000000001',
        fundId,
        guestName: 'Uncle Bob',
        guestEmail: null,
        amount: '100',
        message: 'Congrats!',
        stripePaymentId: null,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/registry/funds/${fundId}/contribute?weddingId=${WEDDING_ID}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            fundId,
            guestName: 'Uncle Bob',
            amount: 100,
            message: 'Congrats!',
          }),
        },
      )
      expect(res.status).toBe(201)
      // Verify weddingId from middleware context is passed to service
      expect(mockedService.addContribution).toHaveBeenCalledWith(
        expect.objectContaining({ fundId, guestName: 'Uncle Bob', amount: 100 }),
        WEDDING_ID,
      )
    })
  })

  describe('POST /registry/gifts', () => {
    it('should create a gift entry', async () => {
      mockedService.createGift.mockResolvedValue({
        id: 'e0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        guestName: null,
        description: 'KitchenAid Mixer',
        estimatedValue: 350,
        thankYouStatus: 'not_started',
        receivedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/registry/gifts?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          description: 'KitchenAid Mixer',
          estimatedValue: 350,
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.description).toBe('KitchenAid Mixer')
    })
  })

  describe('POST /registry/mood-boards', () => {
    it('should create a mood board', async () => {
      mockedService.createMoodBoard.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        name: 'Ceremony Decor',
        description: null,
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/registry/mood-boards?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'Ceremony Decor' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Ceremony Decor')
    })
  })
})
