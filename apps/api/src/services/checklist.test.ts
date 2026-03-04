import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@planfortwo/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
  }
  return {
    db: mockDb,
    checklistCategories: { id: 'id', weddingId: 'weddingId', sortOrder: 'sortOrder' },
    checklistTasks: {
      id: 'id',
      weddingId: 'weddingId',
      categoryId: 'categoryId',
      priority: 'priority',
      completedAt: 'completedAt',
      assignedToUserId: 'assignedToUserId',
      dueDate: 'dueDate',
      sortOrder: 'sortOrder',
      createdAt: 'createdAt',
      title: 'title',
      completedByUserId: 'completedByUserId',
    },
    taskNotes: { taskId: 'taskId', userId: 'userId', createdAt: 'createdAt' },
    taskAttachments: { taskId: 'taskId', createdAt: 'createdAt' },
    users: { id: 'id', firstName: 'firstName', lastName: 'lastName', avatarUrl: 'avatarUrl' },
    activityLog: {},
    weddings: {},
    defaultCategories: [
      { name: 'Venue & Catering', color: '#E57373', icon: 'utensils', sortOrder: 0 },
    ],
    getTemplateTasks: vi.fn().mockReturnValue([
      { title: 'Book venue', description: 'Find and book', categoryIndex: 0, monthsBefore: 12, priority: 'must_do' },
    ]),
  }
})

vi.mock('./activity.js', () => ({
  activityService: {
    log: vi.fn().mockResolvedValue({}),
    getRecent: vi.fn().mockResolvedValue([]),
  },
}))

import { checklistService } from './checklist.js'
import { db } from '@planfortwo/db'

const mockedDb = vi.mocked(db)

describe('Checklist Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hasBeenSeeded', () => {
    it('should return true when categories exist', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ cnt: 3 }]),
        }),
      })

      const result = await checklistService.hasBeenSeeded('wedding-1')
      expect(result).toBe(true)
    })

    it('should return false when no categories exist', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ cnt: 0 }]),
        }),
      })

      const result = await checklistService.hasBeenSeeded('wedding-1')
      expect(result).toBe(false)
    })
  })

  describe('listTasks', () => {
    it('should query tasks with filters', async () => {
      const mockTasks = [{ id: 'task-1', title: 'Book venue' }]
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockTasks),
          }),
        }),
      })

      const result = await checklistService.listTasks({
        weddingId: 'wedding-1',
        status: 'all',
        sortBy: 'sortOrder',
      })

      expect(result).toEqual(mockTasks)
    })
  })

  describe('toggleComplete', () => {
    it('should complete an incomplete task', async () => {
      // First call: select to check current state
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ completedAt: null, title: 'Task 1' }]),
        }),
      })

      // Second call: update
      const mockUpdated = { id: 'task-1', completedAt: new Date() }
      ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      })

      const result = await checklistService.toggleComplete('task-1', 'user-1', 'wedding-1')
      expect(result).toEqual(mockUpdated)
    })

    it('should uncomplete a completed task', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ completedAt: new Date(), title: 'Task 1' }]),
        }),
      })

      const mockUpdated = { id: 'task-1', completedAt: null }
      ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      })

      const result = await checklistService.toggleComplete('task-1', 'user-1', 'wedding-1')
      expect(result).toEqual(mockUpdated)
    })

    it('should return null when task not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await checklistService.toggleComplete('missing', 'user-1', 'wedding-1')
      expect(result).toBeNull()
    })
  })

  describe('bulkReorder', () => {
    it('should use a transaction', async () => {
      ;(mockedDb.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        }
        await cb(tx)
      })

      await checklistService.bulkReorder([
        { id: 'task-1', sortOrder: 0 },
        { id: 'task-2', sortOrder: 1 },
      ])

      expect(mockedDb.transaction).toHaveBeenCalledOnce()
    })
  })
})
