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

vi.mock('../services/checklist.js', () => ({
  checklistService: {
    hasBeenSeeded: vi.fn().mockResolvedValue(true),
    seedChecklist: vi.fn().mockResolvedValue(undefined),
    listTasks: vi.fn().mockResolvedValue([]),
    getTaskWithDetails: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    toggleComplete: vi.fn(),
    deleteTask: vi.fn(),
    reorderTask: vi.fn(),
    bulkReorder: vi.fn(),
    addNote: vi.fn(),
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

import { tasksRoute } from './tasks.js'
import { checklistService } from '../services/checklist.js'
import { featureService } from '../services/features.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedChecklistService = vi.mocked(checklistService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const TASK_ID = 'b0000000-0000-0000-0000-000000000001'
const CATEGORY_ID = 'c0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/tasks', tasksRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

describe('Task Routes', () => {
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

    // Reset to full-tier by default
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
      canInbox: true,
      canMusicIntegration: true,
      canPhotoGallery: true,
    })

    mockedChecklistService.hasBeenSeeded.mockResolvedValue(true)
  })

  describe('GET /tasks', () => {
    it('should return task list', async () => {
      const mockTasks = [{ id: TASK_ID, title: 'Book venue', weddingId: WEDDING_ID }]
      mockedChecklistService.listTasks.mockResolvedValue(mockTasks as never)

      const app = createApp()
      const res = await app.request(`/tasks?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Book venue')
    })

    it('should lazy-seed checklist on first access', async () => {
      mockedChecklistService.hasBeenSeeded.mockResolvedValue(false)
      mockedChecklistService.listTasks.mockResolvedValue([])

      const app = createApp()
      const res = await app.request(`/tasks?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      expect(mockedChecklistService.seedChecklist).toHaveBeenCalledOnce()
    })
  })

  describe('GET /tasks/:id', () => {
    it('should return task with details', async () => {
      const mockTask = {
        id: TASK_ID,
        weddingId: WEDDING_ID,
        title: 'Book venue',
        category: { id: CATEGORY_ID, name: 'Venue' },
        notes: [],
        attachments: [],
        assignedUser: null,
      }
      mockedChecklistService.getTaskWithDetails.mockResolvedValue(mockTask as never)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(TASK_ID)
      expect(body.data.category.name).toBe('Venue')
    })

    it('should return 404 when task not found', async () => {
      mockedChecklistService.getTaskWithDetails.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('TASK_NOT_FOUND')
    })
  })

  describe('POST /tasks', () => {
    const validBody = {
      weddingId: WEDDING_ID,
      categoryId: CATEGORY_ID,
      title: 'New task',
      priority: 'must_do',
    }

    it('should create a task', async () => {
      mockedChecklistService.createTask.mockResolvedValue({
        id: TASK_ID,
        ...validBody,
      } as never)

      const app = createApp()
      const res = await app.request(`/tasks?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(validBody),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.title).toBe('New task')
    })
  })

  describe('PUT /tasks/:id', () => {
    const updateBody = { title: 'Updated task' }

    it('should update a task', async () => {
      mockedChecklistService.updateTask.mockResolvedValue({
        id: TASK_ID,
        title: 'Updated task',
      } as never)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateBody),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.title).toBe('Updated task')
    })
  })

  describe('PATCH /tasks/:id/complete', () => {
    it('should toggle task completion', async () => {
      mockedChecklistService.toggleComplete.mockResolvedValue({
        id: TASK_ID,
        completedAt: new Date().toISOString(),
      } as never)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}/complete?weddingId=${WEDDING_ID}`, {
        method: 'PATCH',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe(TASK_ID)
    })
  })

  describe('PATCH /tasks/:id/reorder', () => {
    it('should reorder a task', async () => {
      mockedChecklistService.reorderTask.mockResolvedValue({
        id: TASK_ID,
        sortOrder: 5,
      } as never)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}/reorder?weddingId=${WEDDING_ID}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ sortOrder: 5 }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.sortOrder).toBe(5)
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      mockedChecklistService.deleteTask.mockResolvedValue(undefined)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })

  describe('POST /tasks/bulk-reorder', () => {
    it('should bulk reorder tasks', async () => {
      mockedChecklistService.bulkReorder.mockResolvedValue(undefined)

      const reorderBody = {
        tasks: [
          { id: 'b0000000-0000-0000-0000-000000000001', sortOrder: 0 },
          { id: 'b0000000-0000-0000-0000-000000000002', sortOrder: 1 },
        ],
      }

      const app = createApp()
      const res = await app.request(`/tasks/bulk-reorder?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reorderBody),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
    })
  })

  describe('POST /tasks/:id/notes', () => {
    it('should add a note to a task', async () => {
      mockedChecklistService.addNote.mockResolvedValue({
        id: 'note-1',
        taskId: TASK_ID,
        content: 'Check availability',
        userId: 'db-user-id',
      } as never)

      const app = createApp()
      const res = await app.request(`/tasks/${TASK_ID}/notes?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: 'Check availability' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.content).toBe('Check availability')
    })
  })
})
