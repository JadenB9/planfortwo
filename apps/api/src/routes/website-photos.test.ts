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

vi.mock('../services/website-photos.js', () => ({
  websitePhotoService: {
    getUploadUrl: vi.fn(),
    register: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
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

import { websitePhotosRoute } from './website-photos.js'
import { websitePhotoService } from '../services/website-photos.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(websitePhotoService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const PHOTO_ID = 'd0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/website-photos', websitePhotosRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
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
}

describe('Website Photo Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('POST /website-photos/upload-url', () => {
    it('should return a presigned upload URL', async () => {
      mockedService.getUploadUrl.mockResolvedValue({
        uploadUrl: 'https://r2.example.com/upload?token=abc',
        r2Key: `weddings/${WEDDING_ID}/photos/xyz.jpg`,
        url: 'https://cdn.example.com/photos/xyz.jpg',
        photoId: PHOTO_ID,
      })

      const app = createApp()
      const res = await app.request(`/website-photos/upload-url?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          fileName: 'ceremony.jpg',
          mimeType: 'image/jpeg',
          fileSize: 2_000_000,
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.uploadUrl).toContain('https://')
      expect(body.data.r2Key).toBeDefined()
      expect(mockedService.getUploadUrl).toHaveBeenCalledWith(
        WEDDING_ID,
        'ceremony.jpg',
        'image/jpeg',
      )
    })

    it('should return 400 for invalid mime type', async () => {
      const app = createApp()
      const res = await app.request(`/website-photos/upload-url?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          fileName: 'doc.pdf',
          mimeType: 'application/pdf',
          fileSize: 500_000,
        }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 403 on free tier', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue({
        tier: 'free',
        canAddTasks: false,
        canEditChecklist: false,
        canDeleteTasks: false,
        canReorderTasks: false,
        canCustomizeCategories: false,
        canAddNotes: false,
        canAddAttachments: false,
        maxGuests: 15,
        canEditGuests: false,
        canDeleteGuests: false,
        canBulkImport: false,
        canRsvp: false,
        canSeatingChart: false,
        canVendorManagement: false,
        canCustomDomain: false,
        canDataExport: false,
        canBudgetCategories: false,
        canBudgetExpenses: false,
        canBudgetAnalytics: false,
        canBudgetExport: false,
        canPaymentSchedule: false,
        canWebsiteBuilder: false,
        canWebsiteAnalytics: false,
        canWebsiteCustomSections: false,
      })

      const app = createApp()
      const res = await app.request(`/website-photos/upload-url?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1_000_000,
        }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FEATURE_LOCKED')
    })
  })

  describe('POST /website-photos', () => {
    it('should register an uploaded photo', async () => {
      const photoData = {
        weddingId: WEDDING_ID,
        r2Key: `weddings/${WEDDING_ID}/photos/xyz.jpg`,
        url: 'https://cdn.example.com/photos/xyz.jpg',
        fileName: 'ceremony.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2_000_000,
        width: 1920,
        height: 1080,
      }

      mockedService.register.mockResolvedValue({
        id: PHOTO_ID,
        ...photoData,
        sectionId: null,
        altText: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/website-photos?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(photoData),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.id).toBe(PHOTO_ID)
      expect(body.data.fileName).toBe('ceremony.jpg')
    })
  })

  describe('DELETE /website-photos/:id', () => {
    it('should delete a photo', async () => {
      mockedService.delete.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/website-photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(mockedService.delete).toHaveBeenCalledWith(PHOTO_ID, WEDDING_ID)
    })

    it('should return 404 for non-existent photo', async () => {
      mockedService.delete.mockRejectedValue(new Error('Photo not found'))

      const app = createApp()
      const res = await app.request(`/website-photos/${PHOTO_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('DELETE_FAILED')
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request(`/website-photos/${PHOTO_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })

  describe('POST /website-photos/reorder', () => {
    it('should reorder photos', async () => {
      mockedService.reorder.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/website-photos/reorder?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          photos: [
            { id: PHOTO_ID, sortOrder: 2 },
            { id: 'd0000000-0000-0000-0000-000000000002', sortOrder: 0 },
          ],
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request(`/website-photos/reorder`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          photos: [{ id: PHOTO_ID, sortOrder: 0 }],
        }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
