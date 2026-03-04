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

vi.mock('../services/checklist.js', () => ({
  checklistService: {
    getStats: vi.fn(),
  },
}))

import { dashboardRoute } from './dashboard.js'
import { checklistService } from '../services/checklist.js'

const mockedChecklistService = vi.mocked(checklistService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/dashboard', dashboardRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Dashboard Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /dashboard/stats', () => {
    it('should return dashboard stats', async () => {
      const mockStats = {
        tasksCompleted: 8,
        tasksTotal: 25,
        upcomingTasks: [
          { id: 'task-1', title: 'Book venue', dueDate: '2026-06-01' },
        ],
        recentActivity: [],
        tasksByCategory: [
          {
            categoryId: 'cat-1',
            categoryName: 'Venue & Catering',
            color: '#E57373',
            total: 10,
            completed: 4,
          },
        ],
      }
      mockedChecklistService.getStats.mockResolvedValue(mockStats as never)

      const app = createApp()
      const res = await app.request(`/dashboard/stats?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.tasksCompleted).toBe(8)
      expect(body.data.tasksTotal).toBe(25)
      expect(body.data.tasksByCategory).toHaveLength(1)
    })

    it('should return 400 when weddingId is missing', async () => {
      const app = createApp()
      const res = await app.request('/dashboard/stats', {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('MISSING_WEDDING_ID')
    })
  })
})
