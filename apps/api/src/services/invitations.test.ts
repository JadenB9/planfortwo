import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@planfortwo/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
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
    partnerInvitations: {
      id: 'id',
      token: 'token',
      email: 'email',
      status: 'status',
      weddingId: 'weddingId',
    },
    weddingMembers: {
      id: 'id',
      weddingId: 'weddingId',
      userId: 'userId',
      role: 'role',
    },
    weddings: { id: 'id', onboardingCompleted: 'onboardingCompleted' },
  }
})

vi.mock('./users.js', () => ({
  userService: { findById: vi.fn() },
}))

vi.mock('./email.js', () => ({
  emailService: { sendPartnerInvite: vi.fn().mockResolvedValue(undefined) },
}))

import { invitationService } from './invitations.js'
import { db } from '@planfortwo/db'
import { userService } from './users.js'
import { emailService } from './email.js'

const mockedDb = vi.mocked(db)

describe('Invitation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAndSend', () => {
    it('should create an invitation and send an email', async () => {
      const mockInvitation = {
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        invitedByUserId: 'c0000000-0000-0000-0000-000000000001',
        email: 'partner@example.com',
        token: 'some-token',
        status: 'pending',
        expiresAt: new Date(),
      }

      ;(mockedDb.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockInvitation])
      ;(userService.findById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        id: 'c0000000-0000-0000-0000-000000000001',
        firstName: 'Jane',
        lastName: 'Doe',
      })

      const result = await invitationService.createAndSend(
        'b0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'partner@example.com',
      )

      expect(result).toEqual(mockInvitation)
      expect(mockedDb.insert).toHaveBeenCalled()
      expect(mockedDb.values).toHaveBeenCalled()
      expect(userService.findById).toHaveBeenCalledWith('c0000000-0000-0000-0000-000000000001')
      expect(emailService.sendPartnerInvite).toHaveBeenCalledWith(
        'partner@example.com',
        'Jane Doe',
        expect.stringContaining('/invite/'),
      )
    })
  })

  describe('findByToken', () => {
    it('should return null when invitation is not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await invitationService.findByToken('nonexistent-token')
      expect(result).toBeNull()
    })

    it('should return the invitation when found', async () => {
      const mockInvitation = {
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        token: 'valid-token',
        email: 'partner@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockInvitation]),
        }),
      })

      const result = await invitationService.findByToken('valid-token')
      expect(result).toEqual(mockInvitation)
    })
  })

  describe('accept', () => {
    it('should throw for a non-existent token', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      await expect(
        invitationService.accept('bad-token', 'c0000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow('Invitation not found')
    })

    it('should throw for an already accepted invitation', async () => {
      const acceptedInvitation = {
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        token: 'accepted-token',
        email: 'partner@example.com',
        status: 'accepted',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([acceptedInvitation]),
        }),
      })

      await expect(
        invitationService.accept('accepted-token', 'c0000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow('Invitation has already been accepted')
    })

    it('should throw for an expired invitation and update status', async () => {
      const expiredInvitation = {
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        token: 'expired-token',
        email: 'partner@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([expiredInvitation]),
        }),
      })

      // update().set().where() for marking expired
      ;(mockedDb.where as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined)

      await expect(
        invitationService.accept('expired-token', 'c0000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow('Invitation has expired')

      expect(mockedDb.update).toHaveBeenCalled()
      expect(mockedDb.set).toHaveBeenCalledWith({ status: 'expired' })
    })

    it('should accept a valid pending invitation via transaction', async () => {
      const pendingInvitation = {
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        token: 'pending-token',
        email: 'partner@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([pendingInvitation]),
        }),
      })
      ;(mockedDb.transaction as ReturnType<typeof vi.fn>).mockImplementation(
        async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const txWhere = vi.fn().mockResolvedValue(undefined)
          const txSet = vi.fn(() => ({ where: txWhere }))
          const txUpdate = vi.fn(() => ({ set: txSet }))

          const txValues = vi.fn().mockResolvedValue(undefined)
          const txInsert = vi.fn(() => ({ values: txValues }))

          const txDelete = vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) }))

          // tx.select() for owned memberships -> returns empty (no owned weddings to clean up)
          const txSelectWhere = vi.fn().mockResolvedValue([])
          const txSelectFrom = vi.fn(() => ({ where: txSelectWhere }))
          const txSelect = vi.fn(() => ({ from: txSelectFrom }))

          const tx = {
            insert: txInsert,
            update: txUpdate,
            delete: txDelete,
            select: txSelect,
          }

          return fn(tx)
        },
      )

      const result = await invitationService.accept(
        'pending-token',
        'c0000000-0000-0000-0000-000000000001',
      )

      expect(result).toBe('b0000000-0000-0000-0000-000000000001')
      expect(mockedDb.transaction).toHaveBeenCalledOnce()
    })
  })
})
