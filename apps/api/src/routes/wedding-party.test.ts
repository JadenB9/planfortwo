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

vi.mock('../services/wedding-party.js', () => ({
  weddingPartyService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    listGifts: vi.fn(),
    createGift: vi.fn(),
    deleteGift: vi.fn(),
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

import { weddingPartyRoute } from './wedding-party.js'
import { weddingPartyService } from '../services/wedding-party.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const MEMBER_ID = 'b0000000-0000-0000-0000-000000000001'
const TASK_ID = 'c0000000-0000-0000-0000-000000000001'
const GIFT_ID = 'd0000000-0000-0000-0000-000000000001'

const mockMember = {
  id: MEMBER_ID,
  weddingId: WEDDING_ID,
  name: 'Alice Smith',
  role: 'bridesmaid',
  customRole: null,
  side: 'bride',
  email: 'alice@example.com',
  phone: null,
  description: null,
  photoUrl: null,
  outfitDetails: null,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockTask = {
  id: TASK_ID,
  memberId: MEMBER_ID,
  weddingId: WEDDING_ID,
  title: 'Pick up flowers',
  description: null,
  dueDate: null,
  isCompleted: false,
  completedAt: null,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
}

const mockGift = {
  id: GIFT_ID,
  memberId: MEMBER_ID,
  weddingId: WEDDING_ID,
  title: 'Custom earrings',
  description: 'Rose gold set',
  budget: 5000,
  createdAt: new Date().toISOString(),
}

const app = new Hono()
app.route('/wedding-party', weddingPartyRoute)

const authHeaders = { Authorization: 'Bearer test-token' }
const jsonHeaders = { ...authHeaders, 'Content-Type': 'application/json' }

describe('Wedding Party Routes', () => {
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
    vi.mocked(weddingPartyService.getById).mockResolvedValue(mockMember)
  })

  describe('GET /wedding-party', () => {
    it('should list all members', async () => {
      vi.mocked(weddingPartyService.list).mockResolvedValue([mockMember])
      const res = await app.request(`/wedding-party?weddingId=${WEDDING_ID}`, {
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Alice Smith')
    })
  })

  describe('GET /wedding-party/:id', () => {
    it('should get a member by id', async () => {
      vi.mocked(weddingPartyService.getById).mockResolvedValue(mockMember)
      const res = await app.request(`/wedding-party/${MEMBER_ID}?weddingId=${WEDDING_ID}`, {
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(MEMBER_ID)
    })

    it('should return 404 when member not found', async () => {
      vi.mocked(weddingPartyService.getById).mockResolvedValue(null)
      const res = await app.request(`/wedding-party/${MEMBER_ID}?weddingId=${WEDDING_ID}`, {
        headers: authHeaders,
      })
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('Member not found')
    })
  })

  describe('POST /wedding-party', () => {
    it('should create a new member', async () => {
      vi.mocked(weddingPartyService.create).mockResolvedValue(mockMember)
      const res = await app.request('/wedding-party', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          name: 'Alice Smith',
          role: 'bridesmaid',
          side: 'bride',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Alice Smith')
    })
  })

  describe('PUT /wedding-party/:id', () => {
    it('should update a member', async () => {
      const updated = { ...mockMember, name: 'Alice Johnson' }
      vi.mocked(weddingPartyService.update).mockResolvedValue(updated)
      const res = await app.request(`/wedding-party/${MEMBER_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ name: 'Alice Johnson' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('Alice Johnson')
    })

    it('should return 404 when updating non-existent member', async () => {
      vi.mocked(weddingPartyService.update).mockResolvedValue(null)
      const res = await app.request(`/wedding-party/${MEMBER_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ name: 'Nobody' }),
      })
      expect(res.status).toBe(404)
    })

    it('should return 400 when weddingId query param is missing', async () => {
      const res = await app.request(`/wedding-party/${MEMBER_ID}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ name: 'Alice' }),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('DELETE /wedding-party/:id', () => {
    it('should delete a member', async () => {
      vi.mocked(weddingPartyService.delete).mockResolvedValue(true)
      const res = await app.request(`/wedding-party/${MEMBER_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 when deleting non-existent member', async () => {
      vi.mocked(weddingPartyService.delete).mockResolvedValue(false)
      const res = await app.request(`/wedding-party/${MEMBER_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      expect(res.status).toBe(404)
    })

    it('should return 400 when weddingId query param is missing', async () => {
      const res = await app.request(`/wedding-party/${MEMBER_ID}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('GET /wedding-party/:id/tasks', () => {
    it('should list tasks for a member', async () => {
      vi.mocked(weddingPartyService.listTasks).mockResolvedValue([mockTask])
      const res = await app.request(`/wedding-party/${MEMBER_ID}/tasks?weddingId=${WEDDING_ID}`, {
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Pick up flowers')
    })
  })

  describe('POST /wedding-party/:id/tasks', () => {
    it('should create a task', async () => {
      vi.mocked(weddingPartyService.createTask).mockResolvedValue(mockTask)
      const res = await app.request(`/wedding-party/${MEMBER_ID}/tasks?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          memberId: MEMBER_ID,
          weddingId: WEDDING_ID,
          title: 'Pick up flowers',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Pick up flowers')
    })
  })

  describe('PUT /wedding-party/tasks/:taskId', () => {
    it('should update a task', async () => {
      const updated = { ...mockTask, title: 'Pick up bouquets' }
      vi.mocked(weddingPartyService.updateTask).mockResolvedValue(updated)
      const res = await app.request(`/wedding-party/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ title: 'Pick up bouquets' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Pick up bouquets')
    })

    it('should return 404 when updating non-existent task', async () => {
      vi.mocked(weddingPartyService.updateTask).mockResolvedValue(null)
      const res = await app.request(`/wedding-party/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ title: 'No task' }),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /wedding-party/tasks/:taskId', () => {
    it('should delete a task', async () => {
      vi.mocked(weddingPartyService.deleteTask).mockResolvedValue(undefined)
      const res = await app.request(`/wedding-party/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })

  describe('GET /wedding-party/:id/gifts', () => {
    it('should list gifts for a member', async () => {
      vi.mocked(weddingPartyService.listGifts).mockResolvedValue([mockGift])
      const res = await app.request(`/wedding-party/${MEMBER_ID}/gifts?weddingId=${WEDDING_ID}`, {
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Custom earrings')
    })
  })

  describe('POST /wedding-party/:id/gifts', () => {
    it('should create a gift', async () => {
      vi.mocked(weddingPartyService.createGift).mockResolvedValue(mockGift)
      const res = await app.request(`/wedding-party/${MEMBER_ID}/gifts?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          memberId: MEMBER_ID,
          weddingId: WEDDING_ID,
          title: 'Custom earrings',
          description: 'Rose gold set',
          budget: 5000,
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('Custom earrings')
    })
  })

  describe('DELETE /wedding-party/gifts/:giftId', () => {
    it('should delete a gift', async () => {
      vi.mocked(weddingPartyService.deleteGift).mockResolvedValue(undefined)
      const res = await app.request(`/wedding-party/gifts/${GIFT_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })
})
