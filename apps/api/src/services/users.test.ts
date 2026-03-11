import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: string, val: string) => ({ column: col, value: val })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
}))

vi.mock('@planfortwo/db', () => {
  const mockReturning = vi.fn()
  const mockValues = vi.fn(() => ({ returning: mockReturning }))
  const mockInsert = vi.fn(() => ({ values: mockValues }))

  const mockWhere = vi.fn()
  const mockSet = vi.fn(() => ({ where: mockWhere }))
  const mockUpdate = vi.fn(() => ({ set: mockSet }))

  const mockDeleteWhere = vi.fn()
  const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }))

  const mockSelectWhere = vi.fn()
  const mockFrom = vi.fn(() => ({ where: mockSelectWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))

  const mockTransaction = vi.fn()

  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: mockSelect,
      transaction: mockTransaction,
      _mocks: {
        mockInsert,
        mockValues,
        mockReturning,
        mockUpdate,
        mockSet,
        mockWhere,
        mockDelete,
        mockDeleteWhere,
        mockSelect,
        mockFrom,
        mockSelectWhere,
        mockTransaction,
      },
    },
    users: { clerkId: 'clerk_id', id: 'id' },
    weddings: { id: 'id' },
    weddingMembers: { id: 'id' },
    partnerInvitations: { email: 'email', status: 'status' },
  }
})

import { db } from '@planfortwo/db'
import { userService } from './users.js'

// Access internal mocks for assertions
const mocks = (db as unknown as { _mocks: Record<string, ReturnType<typeof vi.fn>> })._mocks

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup default chaining after clearing
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning })
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues })
    mocks.mockSet.mockReturnValue({ where: mocks.mockWhere })
    mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet })
    mocks.mockDelete.mockReturnValue({ where: mocks.mockDeleteWhere })
    mocks.mockFrom.mockReturnValue({ where: mocks.mockSelectWhere })
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom })
  })

  describe('handleUserCreated', () => {
    it('should insert user, create default wedding, and create owner membership in a transaction', async () => {
      const mockUser = {
        id: 'uuid-user-1',
        clerkId: 'clerk_abc',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        avatarUrl: null,
      }
      const mockWedding = {
        id: 'uuid-wedding-1',
        name: 'Our Wedding',
      }

      mocks.mockTransaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
          const txReturning = vi.fn()
          const txValues = vi.fn()
          const txInsert = vi.fn(() => ({ values: txValues }))

          // tx.select() for checking pending invitations -> returns empty (no pending invite)
          const txSelectWhere = vi.fn().mockResolvedValue([])
          const txSelectFrom = vi.fn(() => ({ where: txSelectWhere }))
          const txSelect = vi.fn(() => ({ from: txSelectFrom }))

          // First call: insert user -> .values().returning() -> [mockUser]
          txValues.mockReturnValueOnce({ returning: txReturning })
          txReturning.mockResolvedValueOnce([mockUser])

          // Second call: insert wedding -> .values().returning() -> [mockWedding]
          txValues.mockReturnValueOnce({ returning: txReturning })
          txReturning.mockResolvedValueOnce([mockWedding])

          // Third call: insert member -> .values() only (no returning)
          txValues.mockResolvedValueOnce(undefined)

          const tx = { insert: txInsert, select: txSelect }
          await fn(tx)

          expect(txInsert).toHaveBeenCalledTimes(3)
        },
      )

      await userService.handleUserCreated({
        clerkId: 'clerk_abc',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        avatarUrl: null,
      })

      expect(mocks.mockTransaction).toHaveBeenCalledOnce()
    })
  })

  describe('handleUserUpdated', () => {
    it('should update user fields by clerkId', async () => {
      mocks.mockWhere.mockResolvedValueOnce(undefined)

      await userService.handleUserUpdated({
        clerkId: 'clerk_abc',
        email: 'new@example.com',
        firstName: 'Janet',
        lastName: 'Smith',
        avatarUrl: 'https://img.clerk.com/new.png',
      })

      expect(mocks.mockUpdate).toHaveBeenCalled()
      expect(mocks.mockSet).toHaveBeenCalledWith({
        email: 'new@example.com',
        firstName: 'Janet',
        lastName: 'Smith',
        avatarUrl: 'https://img.clerk.com/new.png',
      })
      expect(mocks.mockWhere).toHaveBeenCalled()
    })
  })

  describe('handleUserDeleted', () => {
    it('should delete user and orphaned weddings in a transaction', async () => {
      const mockUser = { id: 'uuid-user-1', clerkId: 'clerk_abc' }

      mocks.mockTransaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
          // tx.select().from(users).where() -> find user
          const txSelectWhere = vi.fn()
          const txSelectFrom = vi.fn(() => ({ where: txSelectWhere }))
          const txSelect = vi.fn(() => ({ from: txSelectFrom }))

          // First select: find user by clerkId -> [mockUser]
          txSelectWhere.mockResolvedValueOnce([mockUser])
          // Second select: find memberships -> [{ weddingId: 'w1' }]
          txSelectWhere.mockResolvedValueOnce([{ weddingId: 'w1' }])
          // Third select: check remaining members for w1 -> [] (none left)
          const txLimit = vi.fn().mockResolvedValueOnce([])
          txSelectWhere.mockReturnValueOnce({ limit: txLimit })

          const txDeleteWhere = vi.fn().mockResolvedValue(undefined)
          const txDelete = vi.fn(() => ({ where: txDeleteWhere }))

          const tx = { select: txSelect, delete: txDelete }
          await fn(tx)

          // Should delete user + orphaned wedding
          expect(txDelete).toHaveBeenCalledTimes(2)
        },
      )

      await userService.handleUserDeleted('clerk_abc')
      expect(mocks.mockTransaction).toHaveBeenCalledOnce()
    })

    it('should not delete wedding if other members remain', async () => {
      const mockUser = { id: 'uuid-user-1', clerkId: 'clerk_abc' }

      mocks.mockTransaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
          const txSelectWhere = vi.fn()
          const txSelectFrom = vi.fn(() => ({ where: txSelectWhere }))
          const txSelect = vi.fn(() => ({ from: txSelectFrom }))

          // Find user
          txSelectWhere.mockResolvedValueOnce([mockUser])
          // Find memberships
          txSelectWhere.mockResolvedValueOnce([{ weddingId: 'w1' }])
          // Check remaining members -> partner still exists
          const txLimit = vi.fn().mockResolvedValueOnce([{ id: 'member-2' }])
          txSelectWhere.mockReturnValueOnce({ limit: txLimit })

          const txDeleteWhere = vi.fn().mockResolvedValue(undefined)
          const txDelete = vi.fn(() => ({ where: txDeleteWhere }))

          const tx = { select: txSelect, delete: txDelete }
          await fn(tx)

          // Should only delete user, NOT the wedding
          expect(txDelete).toHaveBeenCalledTimes(1)
        },
      )

      await userService.handleUserDeleted('clerk_abc')
      expect(mocks.mockTransaction).toHaveBeenCalledOnce()
    })

    it('should do nothing if user not found', async () => {
      mocks.mockTransaction.mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<void>) => {
          const txSelectWhere = vi.fn().mockResolvedValueOnce([])
          const txSelectFrom = vi.fn(() => ({ where: txSelectWhere }))
          const txSelect = vi.fn(() => ({ from: txSelectFrom }))

          const txDelete = vi.fn()

          const tx = { select: txSelect, delete: txDelete }
          await fn(tx)

          expect(txDelete).not.toHaveBeenCalled()
        },
      )

      await userService.handleUserDeleted('clerk_nonexistent')
      expect(mocks.mockTransaction).toHaveBeenCalledOnce()
    })
  })

  describe('findByClerkId', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'uuid-1',
        clerkId: 'clerk_abc',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        avatarUrl: null,
      }

      mocks.mockSelectWhere.mockResolvedValueOnce([mockUser])

      const result = await userService.findByClerkId('clerk_abc')
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      mocks.mockSelectWhere.mockResolvedValueOnce([])

      const result = await userService.findByClerkId('clerk_nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'uuid-1',
        clerkId: 'clerk_abc',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        avatarUrl: null,
      }

      mocks.mockSelectWhere.mockResolvedValueOnce([mockUser])

      const result = await userService.findById('uuid-1')
      expect(result).toEqual(mockUser)
    })

    it('should return null when user not found', async () => {
      mocks.mockSelectWhere.mockResolvedValueOnce([])

      const result = await userService.findById('uuid-nonexistent')
      expect(result).toBeNull()
    })
  })
})
