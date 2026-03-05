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

vi.mock('../services/guest-tags.js', () => ({
  guestTagService: {
    listTags: vi.fn(),
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    seedDefaultTags: vi.fn(),
    assignTag: vi.fn(),
    removeTag: vi.fn(),
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

import { guestTagsRoute } from './guest-tags.js'
import { guestTagService } from '../services/guest-tags.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedGuestTagService = vi.mocked(guestTagService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const TAG_ID = 't0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/guest-tags', guestTagsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Guest Tag Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.mocked(userService.findByClerkId).mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    })
    vi.mocked(weddingService.verifyMembership).mockResolvedValue({
      id: 'member-1', weddingId: WEDDING_ID, userId: 'db-user-id', role: 'owner', joinedAt: new Date(),
    })
  })

  describe('GET /guest-tags', () => {
    it('should list tags for a wedding', async () => {
      const mockTags = [
        { id: TAG_ID, name: 'Family', color: '#FF0000', weddingId: WEDDING_ID, isDefault: true },
      ]
      mockedGuestTagService.listTags.mockResolvedValue(mockTags as never)

      const app = createApp()
      const res = await app.request(`/guest-tags?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Family')
    })
  })

  describe('POST /guest-tags', () => {
    it('should create a tag', async () => {
      const mockTag = {
        id: TAG_ID,
        weddingId: WEDDING_ID,
        name: 'Coworkers',
        color: '#00FF00',
        isDefault: false,
      }
      mockedGuestTagService.createTag.mockResolvedValue(mockTag as never)

      const app = createApp()
      const res = await app.request('/guest-tags', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          name: 'Coworkers',
          color: '#00FF00',
        }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Coworkers')
    })

    it('should return 401 without auth', async () => {
      const app = createApp()
      const res = await app.request('/guest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          name: 'Coworkers',
          color: '#00FF00',
        }),
      })

      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /guest-tags/:id', () => {
    it('should delete a tag', async () => {
      mockedGuestTagService.deleteTag.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/guest-tags/${TAG_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 404 when delete fails', async () => {
      mockedGuestTagService.deleteTag.mockRejectedValue(new Error('Tag not found'))

      const app = createApp()
      const res = await app.request(`/guest-tags/${TAG_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('DELETE_FAILED')
    })
  })
})
