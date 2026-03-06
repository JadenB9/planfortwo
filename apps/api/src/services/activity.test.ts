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
    offset: vi.fn().mockReturnThis(),
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
    activityLog: {
      id: 'id',
      weddingId: 'weddingId',
      userId: 'userId',
      action: 'action',
      entityType: 'entityType',
      entityId: 'entityId',
      metadata: 'metadata',
      createdAt: 'createdAt',
    },
    users: {
      id: 'id',
      firstName: 'firstName',
      lastName: 'lastName',
      avatarUrl: 'avatarUrl',
    },
  }
})

import { activityService } from './activity.js'
import { db } from '@planfortwo/db'

const mockedDb = vi.mocked(db)

describe('Activity Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('log', () => {
    it('should insert an activity log entry and return it', async () => {
      const mockEntry = {
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'task_created',
        entityType: 'task',
        entityId: 'd0000000-0000-0000-0000-000000000001',
        metadata: null,
        createdAt: new Date(),
      }

      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockEntry]),
        }),
      })

      const result = await activityService.log({
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'task_created' as never,
        entityType: 'task' as never,
        entityId: 'd0000000-0000-0000-0000-000000000001',
      })

      expect(result).toEqual(mockEntry)
      expect(mockedDb.insert).toHaveBeenCalled()
    })

    it('should pass metadata when provided', async () => {
      const metadata = { taskTitle: 'Book venue' }
      const mockEntry = {
        id: 'a0000000-0000-0000-0000-000000000002',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'task_created',
        entityType: 'task',
        entityId: 'd0000000-0000-0000-0000-000000000002',
        metadata,
        createdAt: new Date(),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockEntry])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: mockValues,
      })

      const result = await activityService.log({
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'task_created' as never,
        entityType: 'task' as never,
        entityId: 'd0000000-0000-0000-0000-000000000002',
        metadata,
      })

      expect(result).toEqual(mockEntry)
      expect(mockValues).toHaveBeenCalledWith({
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'task_created',
        entityType: 'task',
        entityId: 'd0000000-0000-0000-0000-000000000002',
        metadata,
      })
    })

    it('should set metadata to null when not provided', async () => {
      const mockEntry = {
        id: 'a0000000-0000-0000-0000-000000000003',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'guest_created',
        entityType: 'guest',
        entityId: 'd0000000-0000-0000-0000-000000000003',
        metadata: null,
        createdAt: new Date(),
      }

      const mockReturning = vi.fn().mockResolvedValue([mockEntry])
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: mockValues,
      })

      await activityService.log({
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        action: 'guest_created' as never,
        entityType: 'guest' as never,
        entityId: 'd0000000-0000-0000-0000-000000000003',
      })

      expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({ metadata: null }))
    })
  })

  describe('getRecent', () => {
    it('should return recent activity with user info', async () => {
      const mockResults = [
        {
          activity: {
            id: 'a0000000-0000-0000-0000-000000000001',
            weddingId: 'b0000000-0000-0000-0000-000000000001',
            userId: 'c0000000-0000-0000-0000-000000000001',
            action: 'task_created',
            entityType: 'task',
            entityId: 'd0000000-0000-0000-0000-000000000001',
            metadata: null,
            createdAt: new Date(),
          },
          user: {
            firstName: 'Jane',
            lastName: 'Doe',
            avatarUrl: null,
          },
        },
        {
          activity: {
            id: 'a0000000-0000-0000-0000-000000000002',
            weddingId: 'b0000000-0000-0000-0000-000000000001',
            userId: 'c0000000-0000-0000-0000-000000000002',
            action: 'guest_created',
            entityType: 'guest',
            entityId: 'd0000000-0000-0000-0000-000000000002',
            metadata: { guestName: 'Alice' },
            createdAt: new Date(),
          },
          user: {
            firstName: 'John',
            lastName: 'Smith',
            avatarUrl: 'https://img.example.com/john.png',
          },
        },
      ]

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockResults),
              }),
            }),
          }),
        }),
      })

      const result = await activityService.getRecent('b0000000-0000-0000-0000-000000000001')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        ...mockResults[0]!.activity,
        user: mockResults[0]!.user,
      })
      expect(result[1]).toEqual({
        ...mockResults[1]!.activity,
        user: mockResults[1]!.user,
      })
    })

    it('should use default limit of 20', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: mockLimit,
              }),
            }),
          }),
        }),
      })

      await activityService.getRecent('b0000000-0000-0000-0000-000000000001')

      expect(mockLimit).toHaveBeenCalledWith(20)
    })

    it('should use custom limit when provided', async () => {
      const mockLimit = vi.fn().mockResolvedValue([])
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: mockLimit,
              }),
            }),
          }),
        }),
      })

      await activityService.getRecent('b0000000-0000-0000-0000-000000000001', 5)

      expect(mockLimit).toHaveBeenCalledWith(5)
    })

    it('should return empty array when no activity exists', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      })

      const result = await activityService.getRecent('b0000000-0000-0000-0000-000000000001')

      expect(result).toEqual([])
    })
  })
})
