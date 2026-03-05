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
    guests: {
      id: 'id',
      weddingId: 'weddingId',
      householdId: 'householdId',
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      phone: 'phone',
      rsvpStatus: 'rsvpStatus',
      side: 'side',
      isChild: 'isChild',
      isVip: 'isVip',
      hasPlusOne: 'hasPlusOne',
      plusOneConfirmed: 'plusOneConfirmed',
      mealChoice: 'mealChoice',
      dietary: 'dietary',
      rsvpToken: 'rsvpToken',
      sortOrder: 'sortOrder',
      createdAt: 'createdAt',
    },
    guestTags: {
      id: 'id',
      weddingId: 'weddingId',
      createdAt: 'createdAt',
    },
    guestTagAssignments: {
      guestId: 'guestId',
      tagId: 'tagId',
    },
    households: {
      id: 'id',
    },
  }
})

vi.mock('./activity.js', () => ({
  activityService: {
    log: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
    unparse: vi.fn(),
  },
}))

import { guestService } from './guests.js'
import { db } from '@planfortwo/db'
import Papa from 'papaparse'

const mockedDb = vi.mocked(db)
const mockedPapa = vi.mocked(Papa)

describe('Guest Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getGuestCount', () => {
    it('should return the count of guests for a wedding', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ cnt: 25 }]),
        }),
      })

      const count = await guestService.getGuestCount('wedding-1')
      expect(count).toBe(25)
    })

    it('should return 0 when no guests exist', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ cnt: 0 }]),
        }),
      })

      const count = await guestService.getGuestCount('wedding-1')
      expect(count).toBe(0)
    })
  })

  describe('getStats', () => {
    it('should aggregate stats correctly', async () => {
      const mockGuests = [
        {
          id: 'g1',
          isChild: false,
          hasPlusOne: true,
          plusOneConfirmed: true,
          rsvpStatus: 'accepted',
          dietary: {
            vegetarian: true,
            vegan: false,
            glutenFree: false,
            kosher: false,
            halal: false,
            allergies: ['nuts'],
          },
          mealChoice: 'chicken',
        },
        {
          id: 'g2',
          isChild: true,
          hasPlusOne: false,
          plusOneConfirmed: false,
          rsvpStatus: 'pending',
          dietary: null,
          mealChoice: null,
        },
        {
          id: 'g3',
          isChild: false,
          hasPlusOne: false,
          plusOneConfirmed: false,
          rsvpStatus: 'declined',
          dietary: {
            vegetarian: false,
            vegan: true,
            glutenFree: false,
            kosher: false,
            halal: false,
            allergies: [],
          },
          mealChoice: 'chicken',
        },
      ]

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockGuests),
        }),
      })

      const stats = await guestService.getStats('wedding-1')

      expect(stats.totalGuests).toBe(3)
      expect(stats.adults).toBe(2)
      expect(stats.children).toBe(1)
      expect(stats.plusOnes).toBe(1)
      expect(stats.confirmedPlusOnes).toBe(1)
      expect(stats.rsvpAccepted).toBe(1)
      expect(stats.rsvpDeclined).toBe(1)
      expect(stats.rsvpPending).toBe(1)
      expect(stats.dietarySummary.vegetarian).toBe(1)
      expect(stats.dietarySummary.vegan).toBe(1)
      expect(stats.dietarySummary.withAllergies).toBe(1)
      expect(stats.mealChoiceSummary.chicken).toBe(2)
    })
  })

  describe('setTagsForGuest', () => {
    it('should delete existing and insert new tags', async () => {
      ;(mockedDb.delete as ReturnType<typeof vi.fn>).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })
      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      })

      await guestService.setTagsForGuest('guest-1', ['tag-1', 'tag-2'])

      expect(mockedDb.delete).toHaveBeenCalled()
      expect(mockedDb.insert).toHaveBeenCalled()
    })

    it('should only delete when tagIds is empty', async () => {
      ;(mockedDb.delete as ReturnType<typeof vi.fn>).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      await guestService.setTagsForGuest('guest-1', [])

      expect(mockedDb.delete).toHaveBeenCalled()
      expect(mockedDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('exportCsv', () => {
    it('should export guests as CSV using papaparse', async () => {
      const mockGuests = [
        {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@test.com',
          phone: '555-1234',
          rsvpStatus: 'accepted',
          side: 'bride',
          isChild: false,
          isVip: true,
          hasPlusOne: true,
          plusOneName: 'Bob',
          plusOneConfirmed: true,
          mealChoice: 'chicken',
          songRequest: 'Bohemian Rhapsody',
        },
      ]

      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockGuests),
          }),
        }),
      })

      mockedPapa.unparse.mockReturnValue('firstName,lastName\nAlice,Smith')

      const csv = await guestService.exportCsv('wedding-1')

      expect(mockedPapa.unparse).toHaveBeenCalledOnce()
      expect(csv).toContain('Alice')
    })
  })

  describe('bulkImportCsv', () => {
    it('should import valid CSV rows', async () => {
      mockedPapa.parse.mockReturnValue({
        data: [
          { firstname: 'Alice', lastname: 'Smith', email: 'alice@test.com' },
          { firstname: 'Bob', lastname: 'Jones', email: '' },
        ],
        errors: [],
        meta: {},
      } as never)
      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      })

      const result = await guestService.bulkImportCsv('wedding-1', 'csv-content', 'user-1')

      expect(result.imported).toBe(2)
      expect(result.skipped).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should skip rows with missing names', async () => {
      mockedPapa.parse.mockReturnValue({
        data: [
          { firstname: '', lastname: 'Smith' },
          { firstname: 'Bob', lastname: '' },
          { firstname: 'Carol', lastname: 'White' },
        ],
        errors: [],
        meta: {},
      } as never)
      ;(mockedDb.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      })

      const result = await guestService.bulkImportCsv('wedding-1', 'csv-content', 'user-1')

      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(2)
      expect(result.errors).toHaveLength(2)
    })

    it('should handle parse errors', async () => {
      mockedPapa.parse.mockReturnValue({
        data: [],
        errors: [{ row: 1, message: 'Malformed CSV' }],
        meta: {},
      } as never)

      const result = await guestService.bulkImportCsv('wedding-1', 'bad-csv', 'user-1')

      expect(result.imported).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
