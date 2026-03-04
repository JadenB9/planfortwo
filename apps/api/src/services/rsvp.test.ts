import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@planfortwo/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    transaction: vi.fn(),
  }
  return {
    db: mockDb,
    guests: {
      id: 'id',
      weddingId: 'weddingId',
      householdId: 'householdId',
      rsvpToken: 'rsvpToken',
      rsvpStatus: 'rsvpStatus',
      firstName: 'firstName',
      lastName: 'lastName',
    },
    households: {
      id: 'id',
      rsvpCode: 'rsvpCode',
    },
    weddings: {
      id: 'id',
      rsvpDeadline: 'rsvpDeadline',
    },
    eq: vi.fn(),
    and: vi.fn(),
    ilike: vi.fn(),
  }
})

import { rsvpService } from './rsvp.js'
import { db } from '@planfortwo/db'

const mockedDb = vi.mocked(db)

describe('RSVP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isDeadlinePassed', () => {
    it('should return false when no deadline is set', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ rsvpDeadline: null }]),
          }),
        }),
      })

      const result = await rsvpService.isDeadlinePassed('wedding-1')
      expect(result).toBe(false)
    })

    it('should return true when deadline is in the past', async () => {
      const pastDate = new Date('2020-01-01').toISOString()
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ rsvpDeadline: pastDate }]),
          }),
        }),
      })

      const result = await rsvpService.isDeadlinePassed('wedding-1')
      expect(result).toBe(true)
    })

    it('should return false when deadline is in the future', async () => {
      const futureDate = new Date('2099-12-31').toISOString()
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ rsvpDeadline: futureDate }]),
          }),
        }),
      })

      const result = await rsvpService.isDeadlinePassed('wedding-1')
      expect(result).toBe(false)
    })
  })

  describe('lookupByToken', () => {
    it('should return null when guest not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await rsvpService.lookupByToken('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('lookupByName', () => {
    it('should return matching guests (case-insensitive)', async () => {
      const mockGuests = [
        { id: 'g1', firstName: 'Alice', lastName: 'Smith', weddingId: 'w1' },
      ]

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockGuests),
        }),
      })

      const result = await rsvpService.lookupByName('w1', 'alice', 'smith')
      expect(result).toHaveLength(1)
      expect(result[0].firstName).toBe('Alice')
    })
  })

  describe('submitBatchRsvp', () => {
    it('should use a transaction for batch submissions', async () => {
      // First mock isDeadlinePassed to return false
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ rsvpDeadline: '2099-12-31' }]),
          }),
        }),
      })

      ;(mockedDb.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn()
                  .mockResolvedValueOnce([{
                    id: 'g1',
                    rsvpStatus: 'accepted',
                  }])
                  .mockResolvedValueOnce([{
                    id: 'g2',
                    rsvpStatus: 'declined',
                  }]),
              }),
            }),
          }),
        }
        await cb(tx)
      })

      const submissions = [
        { guestId: 'g1', rsvpStatus: 'accepted' as const },
        { guestId: 'g2', rsvpStatus: 'declined' as const },
      ]

      const results = await rsvpService.submitBatchRsvp(submissions, 'wedding-1')

      expect(mockedDb.transaction).toHaveBeenCalledOnce()
      expect(results).toHaveLength(2)
    })
  })
})
