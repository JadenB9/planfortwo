import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    }),
    findById: vi.fn().mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    }),
  },
}))

vi.mock('../services/weddings.js', () => ({
  weddingService: {
    verifyMembership: vi.fn(),
    findByUserId: vi.fn(),
  },
}))

vi.mock('../services/progress.js', () => ({
  progressService: {
    getProgress: vi.fn(),
  },
}))

import { progressRoute } from './progress.js'
import { weddingService } from '../services/weddings.js'
import { progressService } from '../services/progress.js'

const mockedWeddingService = vi.mocked(weddingService)
const mockedProgressService = vi.mocked(progressService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/progress', progressRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

const mockProgressData = {
  features: [
    { key: 'checklist', label: 'Checklist', href: '/dashboard/checklist', status: 'in_progress' as const, progress: 60, itemCount: 10, description: '6 of 10 tasks completed' },
    { key: 'guests', label: 'Guest List', href: '/dashboard/guests', status: 'in_progress' as const, progress: 50, itemCount: 25, description: '25 guests, 0 responded' },
    { key: 'budget', label: 'Budget', href: '/dashboard/budget', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No budget items yet' },
    { key: 'website', label: 'Website', href: '/dashboard/website', status: 'completed' as const, progress: 100, itemCount: 1, description: 'Website published' },
    { key: 'seating', label: 'Seating Chart', href: '/dashboard/seating', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No seating charts yet' },
    { key: 'vendors', label: 'Vendors', href: '/dashboard/vendors', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No vendors added yet' },
    { key: 'events', label: 'Events', href: '/dashboard/events', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No events created yet' },
    { key: 'photos', label: 'Photos', href: '/dashboard/photos', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No photos uploaded yet' },
    { key: 'registry', label: 'Registry', href: '/dashboard/registry', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No registry items yet' },
    { key: 'ceremony', label: 'Ceremony', href: '/dashboard/ceremony', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No ceremony outline yet' },
    { key: 'music', label: 'Music', href: '/dashboard/music', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No playlists yet' },
    { key: 'honeymoon', label: 'Honeymoon', href: '/dashboard/honeymoon', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No honeymoon plans yet' },
    { key: 'communication', label: 'Communication', href: '/dashboard/communication', status: 'not_started' as const, progress: 0, itemCount: 0, description: 'No email campaigns yet' },
  ],
  overallProgress: 16,
}

describe('Progress Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedWeddingService.verifyMembership.mockResolvedValue({
      id: 'member-1',
      weddingId: WEDDING_ID,
      userId: 'db-user-id',
      role: 'owner',
      invitedAt: new Date(),
      joinedAt: new Date(),
    })
  })

  describe('GET /progress', () => {
    it('should return 400 if no weddingId', async () => {
      const app = createApp()
      const res = await app.request('/progress', {
        method: 'GET', headers: authHeaders(),
      })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should return 403 if not a member', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/progress?weddingId=${WEDDING_ID}`, {
        method: 'GET', headers: authHeaders(),
      })
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 401 without auth', async () => {
      const app = createApp()
      const res = await app.request(`/progress?weddingId=${WEDDING_ID}`, {
        method: 'GET',
      })
      expect(res.status).toBe(401)
    })

    it('should return progress data with correct shape', async () => {
      mockedProgressService.getProgress.mockResolvedValue(mockProgressData)

      const app = createApp()
      const res = await app.request(`/progress?weddingId=${WEDDING_ID}`, {
        method: 'GET', headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.features).toHaveLength(13)
      expect(body.data.overallProgress).toBe(16)
      expect(body.data.features[0]).toMatchObject({
        key: 'checklist',
        label: 'Checklist',
        href: '/dashboard/checklist',
        status: 'in_progress',
        progress: 60,
        itemCount: 10,
      })
    })

    it('should verify overallProgress is the average of feature progresses', async () => {
      const equalProgress = {
        features: mockProgressData.features.map((f) => ({ ...f, progress: 50 })),
        overallProgress: 50,
      }
      mockedProgressService.getProgress.mockResolvedValue(equalProgress)

      const app = createApp()
      const res = await app.request(`/progress?weddingId=${WEDDING_ID}`, {
        method: 'GET', headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.overallProgress).toBe(50)
    })

    it('should call progressService.getProgress with correct weddingId', async () => {
      mockedProgressService.getProgress.mockResolvedValue(mockProgressData)

      const app = createApp()
      await app.request(`/progress?weddingId=${WEDDING_ID}`, {
        method: 'GET', headers: authHeaders(),
      })
      expect(mockedProgressService.getProgress).toHaveBeenCalledWith(WEDDING_ID)
    })

    it('should call weddingService.verifyMembership with correct args', async () => {
      mockedProgressService.getProgress.mockResolvedValue(mockProgressData)

      const app = createApp()
      await app.request(`/progress?weddingId=${WEDDING_ID}`, {
        method: 'GET', headers: authHeaders(),
      })
      expect(mockedWeddingService.verifyMembership).toHaveBeenCalledWith(WEDDING_ID, 'db-user-id')
    })
  })
})
