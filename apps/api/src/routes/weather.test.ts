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

vi.mock('../services/weather.js', () => ({
  weatherService: { getForecast: vi.fn() },
}))

import { weatherRoute } from './weather.js'
import { weatherService } from '../services/weather.js'

const mockedService = vi.mocked(weatherService)

function createApp() {
  const app = new Hono()
  app.route('/weather', weatherRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

const mockForecast = [
  {
    date: '2026-06-15',
    temperatureMax: 28,
    temperatureMin: 18,
    precipitation: 0,
    weatherCode: 0,
    description: 'Clear sky',
  },
  {
    date: '2026-06-16',
    temperatureMax: 25,
    temperatureMin: 16,
    precipitation: 2.5,
    weatherCode: 61,
    description: 'Slight rain',
  },
  {
    date: '2026-06-17',
    temperatureMax: 22,
    temperatureMin: 14,
    precipitation: 0,
    weatherCode: 2,
    description: 'Partly cloudy',
  },
]

describe('Weather Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /weather', () => {
    it('should return forecast data', async () => {
      mockedService.getForecast.mockResolvedValue(mockForecast)

      const app = createApp()
      const res = await app.request('/weather?latitude=40.7128&longitude=-74.006&days=3', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(3)
      expect(body.data[0].description).toBe('Clear sky')
      expect(mockedService.getForecast).toHaveBeenCalledWith(40.7128, -74.006, 3)
    })

    it('should use default days when not provided', async () => {
      mockedService.getForecast.mockResolvedValue(mockForecast)

      const app = createApp()
      const res = await app.request('/weather?latitude=51.5074&longitude=-0.1278', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      expect(mockedService.getForecast).toHaveBeenCalledWith(51.5074, -0.1278, 7)
    })

    it('should return 401 without auth', async () => {
      const app = createApp()
      const res = await app.request('/weather?latitude=40.7&longitude=-74.0&days=7', {
        method: 'GET',
      })
      expect(res.status).toBe(401)
    })

    it('should return 400 for invalid latitude', async () => {
      const app = createApp()
      const res = await app.request('/weather?latitude=100&longitude=-74.0&days=7', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for invalid longitude', async () => {
      const app = createApp()
      const res = await app.request('/weather?latitude=40.7&longitude=200&days=7', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(400)
    })

    it('should return 400 for missing coordinates', async () => {
      const app = createApp()
      const res = await app.request('/weather?days=7', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(400)
    })
  })
})
