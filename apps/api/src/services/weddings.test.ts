import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./invitations.js', () => ({
  invitationService: {
    createAndSend: vi.fn(),
  },
}))

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
    weddings: {
      id: 'id',
      name: 'name',
      date: 'date',
      venue: 'venue',
      city: 'city',
      state: 'state',
      country: 'country',
      guestCountEstimate: 'guestCountEstimate',
      budgetTotal: 'budgetTotal',
      style: 'style',
      onboardingCompleted: 'onboardingCompleted',
    },
    weddingMembers: {
      id: 'id',
      weddingId: 'weddingId',
      userId: 'userId',
      role: 'role',
    },
    users: {
      id: 'id',
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      avatarUrl: 'avatarUrl',
    },
  }
})

import { weddingService } from './weddings.js'
import { invitationService } from './invitations.js'
import { db } from '@planfortwo/db'

const mockedDb = vi.mocked(db)

describe('Wedding Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findByUserId', () => {
    it('should return null when no weddings found', async () => {
      // First select: user lookup (no activeWeddingId)
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ activeWeddingId: null }]),
        }),
      })
      // Second select: wedding memberships
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await weddingService.findByUserId('c0000000-0000-0000-0000-000000000001')
      expect(result).toBeNull()
    })

    it('should return single wedding when only one exists', async () => {
      const mockWedding = {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Our Wedding',
        onboardingCompleted: false,
      }

      // First select: user lookup (no activeWeddingId)
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ activeWeddingId: null }]),
        }),
      })
      // Second select: wedding memberships
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ wedding: mockWedding, role: 'owner' }]),
          }),
        }),
      })

      const result = await weddingService.findByUserId('c0000000-0000-0000-0000-000000000001')
      expect(result).toEqual(mockWedding)
    })

    it('should prefer onboarded wedding when multiple exist', async () => {
      const unfinishedWedding = {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Draft Wedding',
        onboardingCompleted: false,
      }
      const onboardedWedding = {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'Real Wedding',
        onboardingCompleted: true,
      }

      // First select: user lookup (no activeWeddingId)
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ activeWeddingId: null }]),
        }),
      })
      // Second select: wedding memberships
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { wedding: unfinishedWedding, role: 'owner' },
              { wedding: onboardedWedding, role: 'owner' },
            ]),
          }),
        }),
      })

      const result = await weddingService.findByUserId('c0000000-0000-0000-0000-000000000001')
      expect(result).toEqual(onboardedWedding)
    })

    it('should prefer partner role when no onboarded wedding exists', async () => {
      const partnerWedding = {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Partner Wedding',
        onboardingCompleted: false,
      }
      const plannerWedding = {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'Planner Wedding',
        onboardingCompleted: false,
      }

      // First select: user lookup (no activeWeddingId)
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ activeWeddingId: null }]),
        }),
      })
      // Second select: wedding memberships (no owner, no onboarded)
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { wedding: plannerWedding, role: 'planner' },
              { wedding: partnerWedding, role: 'partner' },
            ]),
          }),
        }),
      })

      const result = await weddingService.findByUserId('c0000000-0000-0000-0000-000000000001')
      expect(result).toEqual(partnerWedding)
    })

    it('should return first wedding as fallback when no onboarded or partner', async () => {
      const firstWedding = {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'First Wedding',
        onboardingCompleted: false,
      }
      const secondWedding = {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'Second Wedding',
        onboardingCompleted: false,
      }

      // First select: user lookup (no activeWeddingId)
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ activeWeddingId: null }]),
        }),
      })
      // Second select: wedding memberships
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { wedding: firstWedding, role: 'planner' },
              { wedding: secondWedding, role: 'family' },
            ]),
          }),
        }),
      })

      const result = await weddingService.findByUserId('c0000000-0000-0000-0000-000000000001')
      expect(result).toEqual(firstWedding)
    })
  })

  describe('completeOnboarding', () => {
    it('should update wedding with onboardingCompleted true', async () => {
      const mockUpdated = {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Our Wedding',
        venue: 'Grand Ballroom',
        onboardingCompleted: true,
      }

      ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdated]),
          }),
        }),
      })

      const result = await weddingService.completeOnboarding(
        'b0000000-0000-0000-0000-000000000001',
        { name: 'Our Wedding', venue: 'Grand Ballroom' },
      )

      expect(result).toEqual(mockUpdated)
    })

    it('should return null when wedding not found', async () => {
      ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await weddingService.completeOnboarding(
        'b0000000-0000-0000-0000-000000000099',
        { name: 'Missing Wedding' },
      )

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should return null when no data keys provided', async () => {
      const result = await weddingService.update('b0000000-0000-0000-0000-000000000001', {})
      expect(result).toBeNull()
      expect(mockedDb.update).not.toHaveBeenCalled()
    })

    it('should update with provided fields', async () => {
      const mockUpdated = {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Updated Name',
        venue: 'New Venue',
      }

      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUpdated]),
        }),
      })
      ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: mockSet,
      })

      const result = await weddingService.update('b0000000-0000-0000-0000-000000000001', {
        name: 'Updated Name',
        venue: 'New Venue',
      })

      expect(result).toEqual(mockUpdated)
      expect(mockSet).toHaveBeenCalledWith({
        name: 'Updated Name',
        venue: 'New Venue',
      })
    })

    it('should only include defined fields in update', async () => {
      const mockUpdated = {
        id: 'b0000000-0000-0000-0000-000000000001',
        city: 'Nashville',
      }

      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUpdated]),
        }),
      })
      ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
        set: mockSet,
      })

      await weddingService.update('b0000000-0000-0000-0000-000000000001', {
        city: 'Nashville',
      })

      expect(mockSet).toHaveBeenCalledWith({ city: 'Nashville' })
    })
  })

  describe('verifyMembership', () => {
    it('should return member when membership exists', async () => {
      const mockMember = {
        id: 'e0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000001',
        role: 'owner',
      }

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMember]),
        }),
      })

      const result = await weddingService.verifyMembership(
        'b0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
      )
      expect(result).toEqual(mockMember)
    })

    it('should return null when membership does not exist', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await weddingService.verifyMembership(
        'b0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000099',
      )
      expect(result).toBeNull()
    })
  })

  describe('getMembers', () => {
    it('should return members with user info', async () => {
      const mockResults = [
        {
          member: {
            id: 'e0000000-0000-0000-0000-000000000001',
            weddingId: 'b0000000-0000-0000-0000-000000000001',
            userId: 'c0000000-0000-0000-0000-000000000001',
            role: 'owner',
          },
          user: {
            id: 'c0000000-0000-0000-0000-000000000001',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
            avatarUrl: null,
          },
        },
      ]

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockResults),
          }),
        }),
      })

      const result = await weddingService.getMembers('b0000000-0000-0000-0000-000000000001')
      expect(result).toEqual(mockResults)
      expect(result[0]!.user.email).toBe('jane@example.com')
    })

    it('should return empty array when no members', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await weddingService.getMembers('b0000000-0000-0000-0000-000000000001')
      expect(result).toEqual([])
    })
  })

  describe('addMemberByEmail', () => {
    beforeEach(() => {
      ;(invitationService.createAndSend as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'a0000000-0000-0000-0000-000000000001',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        email: 'unknown@example.com',
        token: 'invite-token',
        role: 'planner',
        status: 'pending',
      })
    })

    it('should send invitation when user not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await weddingService.addMemberByEmail(
        'b0000000-0000-0000-0000-000000000001',
        'unknown@example.com',
        'planner',
        'c0000000-0000-0000-0000-000000000001',
      )

      expect(result).toHaveProperty('invited', true)
      expect(result).toHaveProperty('message')
      expect(invitationService.createAndSend).toHaveBeenCalledWith(
        'b0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'unknown@example.com',
        'planner',
      )
    })

    it('should return error when invitation sending fails', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })
      ;(invitationService.createAndSend as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Failed to send'),
      )

      const result = await weddingService.addMemberByEmail(
        'b0000000-0000-0000-0000-000000000001',
        'unknown@example.com',
        'planner',
        'c0000000-0000-0000-0000-000000000001',
      )

      expect(result).toEqual({ error: 'Failed to send' })
    })

    it('should return error when user is already a member', async () => {
      const mockUser = {
        id: 'c0000000-0000-0000-0000-000000000002',
        email: 'existing@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        avatarUrl: null,
      }

      // First select: find user by email
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser]),
        }),
      })

      // Second select: verifyMembership -> found existing
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 'e0000000-0000-0000-0000-000000000002',
              weddingId: 'b0000000-0000-0000-0000-000000000001',
              userId: 'c0000000-0000-0000-0000-000000000002',
              role: 'planner',
            },
          ]),
        }),
      })

      const result = await weddingService.addMemberByEmail(
        'b0000000-0000-0000-0000-000000000001',
        'existing@example.com',
        'planner',
        'c0000000-0000-0000-0000-000000000001',
      )

      expect(result).toEqual({
        error: 'This person is already a member of this wedding.',
      })
    })

    it('should insert member and return member with user info', async () => {
      const mockUser = {
        id: 'c0000000-0000-0000-0000-000000000003',
        email: 'new@example.com',
        firstName: 'Carol',
        lastName: 'White',
        avatarUrl: 'https://img.example.com/carol.png',
      }
      const mockMember = {
        id: 'e0000000-0000-0000-0000-000000000003',
        weddingId: 'b0000000-0000-0000-0000-000000000001',
        userId: 'c0000000-0000-0000-0000-000000000003',
        role: 'family',
      }

      // First select: find user by email
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser]),
        }),
      })

      // Second select: verifyMembership -> not found
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      // Insert member
      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMember]),
        }),
      })

      const result = await weddingService.addMemberByEmail(
        'b0000000-0000-0000-0000-000000000001',
        'new@example.com',
        'family',
        'c0000000-0000-0000-0000-000000000001',
      )

      expect(result).toEqual({
        member: mockMember,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          avatarUrl: mockUser.avatarUrl,
        },
      })
    })
  })

  describe('removeMember', () => {
    it('should return null when member not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await weddingService.removeMember(
        'b0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000099',
      )
      expect(result).toBeNull()
    })

    it('should return error when trying to remove owner', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 'e0000000-0000-0000-0000-000000000001',
              weddingId: 'b0000000-0000-0000-0000-000000000001',
              userId: 'c0000000-0000-0000-0000-000000000001',
              role: 'owner',
            },
          ]),
        }),
      })

      const result = await weddingService.removeMember(
        'b0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
      )

      expect(result).toEqual({ error: 'Cannot remove the wedding owner.' })
    })

    it('should delete non-owner member and return removed true', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 'e0000000-0000-0000-0000-000000000002',
              weddingId: 'b0000000-0000-0000-0000-000000000001',
              userId: 'c0000000-0000-0000-0000-000000000002',
              role: 'planner',
            },
          ]),
        }),
      })
      ;(mockedDb.delete as ReturnType<typeof vi.fn>).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      const result = await weddingService.removeMember(
        'b0000000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000002',
      )

      expect(result).toEqual({ removed: true })
      expect(mockedDb.delete).toHaveBeenCalled()
    })
  })
})
