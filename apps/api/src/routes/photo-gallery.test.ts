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

vi.mock('../services/photo-gallery.js', () => ({
  photoGalleryService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    moderate: vi.fn(),
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
    }),
  },
}))

import { photoGalleryRoute } from './photo-gallery.js'
import { photoGalleryService } from '../services/photo-gallery.js'

const mockedService = vi.mocked(photoGalleryService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const PHOTO_ID = 'b0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/photos', photoGalleryRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

const samplePhoto = {
  id: PHOTO_ID,
  weddingId: WEDDING_ID,
  r2Key: `weddings/${WEDDING_ID}/photos/ceremony.jpg`,
  url: 'https://cdn.example.com/photos/ceremony.jpg',
  fileName: 'ceremony.jpg',
  mimeType: 'image/jpeg',
  fileSize: 2_000_000,
  width: 1920,
  height: 1080,
  uploaderName: 'Jane Doe',
  uploaderEmail: 'jane@example.com',
  source: 'couple' as const,
  caption: 'Our ceremony',
  moderationStatus: 'pending' as const,
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Photo Gallery Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /photos', () => {
    it('should list photos for a wedding', async () => {
      mockedService.list.mockResolvedValue([samplePhoto] as never)

      const app = createApp()
      const res = await app.request(`/photos?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].fileName).toBe('ceremony.jpg')
      expect(mockedService.list).toHaveBeenCalledWith(WEDDING_ID)
    })

    it('should return empty array when no photos exist', async () => {
      mockedService.list.mockResolvedValue([] as never)

      const app = createApp()
      const res = await app.request(`/photos?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(0)
    })
  })

  describe('GET /photos/:id', () => {
    it('should return a photo by id', async () => {
      mockedService.getById.mockResolvedValue(samplePhoto as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(PHOTO_ID)
      expect(body.data.fileName).toBe('ceremony.jpg')
      expect(mockedService.getById).toHaveBeenCalledWith(PHOTO_ID, WEDDING_ID)
    })

    it('should return 404 for non-existent photo', async () => {
      mockedService.getById.mockResolvedValue(null as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /photos', () => {
    it('should create a photo and return 201', async () => {
      const createInput = {
        weddingId: WEDDING_ID,
        r2Key: `weddings/${WEDDING_ID}/photos/new.jpg`,
        url: 'https://cdn.example.com/photos/new.jpg',
        fileName: 'new.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1_500_000,
      }

      mockedService.create.mockResolvedValue({
        id: PHOTO_ID,
        ...createInput,
        width: null,
        height: null,
        uploaderName: null,
        uploaderEmail: null,
        source: 'couple',
        caption: null,
        moderationStatus: 'pending',
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/photos', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(createInput),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.id).toBe(PHOTO_ID)
      expect(body.data.fileName).toBe('new.jpg')
      expect(mockedService.create).toHaveBeenCalledWith(createInput)
    })

    it('should return 400 for invalid body', async () => {
      const app = createApp()
      const res = await app.request('/photos', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: 'not-a-uuid' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /photos/:id', () => {
    it('should update a photo', async () => {
      const updateInput = { caption: 'Updated caption', isFavorite: true }

      mockedService.update.mockResolvedValue({
        ...samplePhoto,
        caption: 'Updated caption',
        isFavorite: true,
      } as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateInput),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.caption).toBe('Updated caption')
      expect(body.data.isFavorite).toBe(true)
      expect(mockedService.update).toHaveBeenCalledWith(PHOTO_ID, WEDDING_ID, updateInput)
    })

    it('should return 404 when photo not found', async () => {
      mockedService.update.mockResolvedValue(null as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ caption: 'Does not exist' }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ caption: 'No wedding id' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('DELETE /photos/:id', () => {
    it('should delete a photo', async () => {
      mockedService.delete.mockResolvedValue(samplePhoto as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(mockedService.delete).toHaveBeenCalledWith(PHOTO_ID, WEDDING_ID)
    })

    it('should return 404 when photo not found', async () => {
      mockedService.delete.mockResolvedValue(null as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('POST /photos/:id/moderate', () => {
    it('should approve a photo', async () => {
      mockedService.moderate.mockResolvedValue({
        ...samplePhoto,
        moderationStatus: 'approved',
      } as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}/moderate?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.moderationStatus).toBe('approved')
      expect(mockedService.moderate).toHaveBeenCalledWith(PHOTO_ID, WEDDING_ID, 'approved')
    })

    it('should reject a photo', async () => {
      mockedService.moderate.mockResolvedValue({
        ...samplePhoto,
        moderationStatus: 'rejected',
      } as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}/moderate?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'rejected' }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.moderationStatus).toBe('rejected')
      expect(mockedService.moderate).toHaveBeenCalledWith(PHOTO_ID, WEDDING_ID, 'rejected')
    })

    it('should return 404 when photo not found', async () => {
      mockedService.moderate.mockResolvedValue(null as never)

      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}/moderate?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request(`/photos/${PHOTO_ID}/moderate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'approved' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
