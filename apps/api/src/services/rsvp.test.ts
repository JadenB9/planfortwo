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
    it('should return single result when one guest matches', async () => {
      const mockGuest = {
        id: 'g1',
        firstName: 'Alice',
        lastName: 'Smith',
        weddingId: 'w1',
        householdId: null,
        email: 'alice@example.com',
        phone: '555-1234',
        rsvpToken: 'tok_abc',
      }
      const mockWedding = {
        id: 'w1',
        name: 'Smith Wedding',
        date: '2026-09-15',
        rsvpDeadline: '2099-12-31',
      }

      // First call: lookupByName query (no .limit)
      // Second call: buildLookupResult -> weddings query (with .limit)
      // Third call: buildLookupResult -> isDeadlinePassed (with .limit)
      let callCount = 0
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // lookupByName: select().from(guests).where(...)
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([mockGuest]),
            }),
          }
        }
        // buildLookupResult + isDeadlinePassed: select().from(weddings).where(...).limit(1)
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockWedding]),
            }),
          }),
        }
      })

      const result = await rsvpService.lookupByName('w1', 'alice', 'smith')
      expect(result.type).toBe('single')
      if (result.type === 'single') {
        expect(result.result.guest.firstName).toBe('Alice')
        expect(result.result.weddingName).toBe('Smith Wedding')
      }
    })

    it('should return multiple when several guests match', async () => {
      const mockGuests = [
        {
          id: 'g1',
          firstName: 'Alice',
          lastName: 'Smith',
          weddingId: 'w1',
          email: 'a1@example.com',
          phone: '555-1111',
          rsvpToken: 'tok_1',
        },
        {
          id: 'g2',
          firstName: 'Alice',
          lastName: 'Smith',
          weddingId: 'w1',
          email: 'a2@example.com',
          phone: '555-2222',
          rsvpToken: 'tok_2',
        },
      ]

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockGuests),
        }),
      })

      const result = await rsvpService.lookupByName('w1', 'alice', 'smith')
      expect(result.type).toBe('multiple')
      if (result.type === 'multiple') {
        expect(result.guests).toHaveLength(2)
      }
    })

    it('should return none when no guests match', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await rsvpService.lookupByName('w1', 'nobody', 'here')
      expect(result.type).toBe('none')
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
                returning: vi
                  .fn()
                  .mockResolvedValueOnce([
                    {
                      id: 'g1',
                      rsvpStatus: 'accepted',
                    },
                  ])
                  .mockResolvedValueOnce([
                    {
                      id: 'g2',
                      rsvpStatus: 'declined',
                    },
                  ]),
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
