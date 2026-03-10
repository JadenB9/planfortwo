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

vi.mock('../services/vendors.js', () => ({
  vendorService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listCommunications: vi.fn(),
    addCommunication: vi.fn(),
    deleteCommunication: vi.fn(),
    listContracts: vi.fn(),
    createContract: vi.fn(),
    updateContract: vi.fn(),
    deleteContract: vi.fn(),
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

import { vendorsRoute } from './vendors.js'
import { vendorService } from '../services/vendors.js'
import { featureService } from '../services/features.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedService = vi.mocked(vendorService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const VENDOR_ID = 'b0000000-0000-0000-0000-000000000001'

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
  app.route('/vendors', vendorsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Vendor Routes', () => {
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
    mockedService.getById.mockResolvedValue({
      id: VENDOR_ID,
      weddingId: WEDDING_ID,
      name: 'Photo Studio',
      category: 'Photography',
      status: 'booked',
      contactName: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      notes: null,
      cost: null,
      depositAmount: null,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /vendors', () => {
    it('should list vendors', async () => {
      mockedService.list.mockResolvedValue([
        {
          id: VENDOR_ID,
          weddingId: WEDDING_ID,
          name: 'Photo Studio',
          category: 'Photography',
          status: 'booked',
          contactName: 'John',
          email: null,
          phone: null,
          website: null,
          address: null,
          notes: null,
          cost: 5000,
          depositAmount: 1000,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/vendors?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Photo Studio')
    })
  })

  describe('POST /vendors', () => {
    it('should create a vendor', async () => {
      mockedService.create.mockResolvedValue({
        id: VENDOR_ID,
        weddingId: WEDDING_ID,
        name: 'DJ Cool',
        category: 'Music',
        status: 'researching',
        contactName: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        notes: null,
        cost: null,
        depositAmount: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/vendors?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'DJ Cool', category: 'Music' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('DJ Cool')
    })

    it('should return 403 on free tier', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)
      const app = createApp()
      const res = await app.request(`/vendors?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'DJ', category: 'Music' }),
      })
      expect(res.status).toBe(403)
    })
  })

  describe('PUT /vendors/:id', () => {
    it('should update a vendor', async () => {
      mockedService.update.mockResolvedValue({
        id: VENDOR_ID,
        weddingId: WEDDING_ID,
        name: 'DJ Awesome',
        category: 'Music',
        status: 'booked',
        contactName: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        notes: null,
        cost: 2000,
        depositAmount: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/vendors/${VENDOR_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'DJ Awesome', status: 'booked' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('DJ Awesome')
    })

    it('should return 404 for non-existent vendor', async () => {
      mockedService.update.mockResolvedValue(null)
      const app = createApp()
      const res = await app.request(`/vendors/${VENDOR_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'Test' }),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /vendors/:id', () => {
    it('should delete a vendor', async () => {
      mockedService.delete.mockResolvedValue(true as never)
      const app = createApp()
      const res = await app.request(`/vendors/${VENDOR_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /vendors/:id/communications', () => {
    it('should add a communication log', async () => {
      mockedService.addCommunication.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000001',
        vendorId: VENDOR_ID,
        type: 'call',
        subject: 'Pricing',
        content: 'Discussed pricing',
        contactDate: new Date(),
        followUpDate: null,
        attachmentUrl: null,
        attachmentName: null,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(
        `/vendors/${VENDOR_ID}/communications?weddingId=${WEDDING_ID}`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            vendorId: VENDOR_ID,
            content: 'Discussed pricing',
            type: 'call',
            subject: 'Pricing',
          }),
        },
      )
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.content).toBe('Discussed pricing')
    })
  })

  describe('POST /vendors/:id/contracts', () => {
    it('should create a contract', async () => {
      mockedService.createContract.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000002',
        vendorId: VENDOR_ID,
        title: 'Photography Contract',
        fileUrl: null,
        fileName: null,
        status: 'pending',
        signedDate: null,
        depositDueDate: null,
        balanceDueDate: null,
        cancellationDeadline: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/vendors/${VENDOR_ID}/contracts?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ vendorId: VENDOR_ID, title: 'Photography Contract' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Photography Contract')
    })
  })
})
