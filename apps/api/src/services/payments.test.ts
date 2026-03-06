import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('stripe', () => ({
  default: vi.fn(),
}))

vi.mock('@planfortwo/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
  return {
    db: mockDb,
    purchases: {
      id: 'id',
      weddingId: 'weddingId',
      userId: 'userId',
      status: 'status',
    },
    referrals: {
      id: 'id',
      referrerUserId: 'referrerUserId',
      referralCode: 'referralCode',
      isConverted: 'isConverted',
    },
    contactSubmissions: {
      id: 'id',
      name: 'name',
      email: 'email',
      isRead: 'isRead',
    },
    weddings: { id: 'id', tier: 'tier' },
  }
})

import { purchaseService, referralService, contactService } from './payments.js'
import { db } from '@planfortwo/db'

const mockedDb = vi.mocked(db)

describe('Payment Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('purchaseService', () => {
    describe('list', () => {
      it('should return purchases for a wedding', async () => {
        const mockPurchases = [
          {
            id: 'a0000000-0000-0000-0000-000000000001',
            weddingId: 'b0000000-0000-0000-0000-000000000001',
            amount: '200.00',
            status: 'completed',
          },
        ]

        ;(mockedDb.where as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockPurchases)

        const result = await purchaseService.list('b0000000-0000-0000-0000-000000000001')
        expect(result).toEqual(mockPurchases)
        expect(mockedDb.select).toHaveBeenCalled()
        expect(mockedDb.from).toHaveBeenCalled()
      })
    })

    describe('getById', () => {
      it('should return a purchase when found', async () => {
        const mockPurchase = {
          id: 'a0000000-0000-0000-0000-000000000001',
          weddingId: 'b0000000-0000-0000-0000-000000000001',
          amount: '200.00',
          status: 'pending',
        }

        ;(mockedDb.where as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockPurchase])

        const result = await purchaseService.getById(
          'a0000000-0000-0000-0000-000000000001',
          'b0000000-0000-0000-0000-000000000001',
        )
        expect(result).toEqual(mockPurchase)
      })

      it('should return null when purchase is not found', async () => {
        ;(mockedDb.where as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])

        const result = await purchaseService.getById(
          'a0000000-0000-0000-0000-000000000099',
          'b0000000-0000-0000-0000-000000000001',
        )
        expect(result).toBeNull()
      })
    })

    describe('create', () => {
      it('should insert and return the new purchase', async () => {
        const mockPurchase = {
          id: 'a0000000-0000-0000-0000-000000000001',
          weddingId: 'b0000000-0000-0000-0000-000000000001',
          userId: 'c0000000-0000-0000-0000-000000000001',
          amount: '200.00',
          currency: 'usd',
          status: 'pending',
        }

        ;(mockedDb.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockPurchase])

        const result = await purchaseService.create(
          'b0000000-0000-0000-0000-000000000001',
          'c0000000-0000-0000-0000-000000000001',
          '200.00',
          'usd',
        )

        expect(result).toEqual(mockPurchase)
        expect(mockedDb.insert).toHaveBeenCalled()
        expect(mockedDb.values).toHaveBeenCalledWith({
          weddingId: 'b0000000-0000-0000-0000-000000000001',
          userId: 'c0000000-0000-0000-0000-000000000001',
          amount: '200.00',
          currency: 'usd',
        })
      })
    })

    describe('updateStatus', () => {
      it('should update purchase status', async () => {
        const mockUpdated = {
          id: 'a0000000-0000-0000-0000-000000000001',
          status: 'completed',
        }

        ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockUpdated]),
            }),
          }),
        })

        const result = await purchaseService.updateStatus(
          'a0000000-0000-0000-0000-000000000001',
          'completed',
          'pi_test_123',
        )

        expect(result).toEqual(mockUpdated)
      })

      it('should return null when purchase not found for update', async () => {
        ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        })

        const result = await purchaseService.updateStatus(
          'a0000000-0000-0000-0000-000000000099',
          'failed',
        )

        expect(result).toBeNull()
      })
    })

    describe('handleCheckoutCompleted', () => {
      it('should update purchase and wedding tier on checkout completion', async () => {
        const mockSession = {
          metadata: {
            weddingId: 'b0000000-0000-0000-0000-000000000001',
            purchaseId: 'a0000000-0000-0000-0000-000000000001',
          },
          payment_intent: 'pi_test_123',
        } as unknown as import('stripe').default.Checkout.Session

        // First update call: purchases
        // Second update call: weddings
        ;(mockedDb.where as ReturnType<typeof vi.fn>)
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined)

        await purchaseService.handleCheckoutCompleted(mockSession)

        expect(mockedDb.update).toHaveBeenCalledTimes(2)
      })

      it('should return early when metadata is missing', async () => {
        const mockSession = {
          metadata: {},
        } as unknown as import('stripe').default.Checkout.Session

        await purchaseService.handleCheckoutCompleted(mockSession)

        expect(mockedDb.update).not.toHaveBeenCalled()
      })
    })
  })

  describe('referralService', () => {
    describe('getByCode', () => {
      it('should return a referral when found', async () => {
        const mockRef = {
          id: 'a0000000-0000-0000-0000-000000000001',
          referralCode: 'ABC123',
          referrerUserId: 'c0000000-0000-0000-0000-000000000001',
        }

        ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([mockRef]),
          }),
        })

        const result = await referralService.getByCode('ABC123')
        expect(result).toEqual(mockRef)
      })

      it('should return null when referral code is not found', async () => {
        ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        })

        const result = await referralService.getByCode('INVALID')
        expect(result).toBeNull()
      })
    })

    describe('create', () => {
      it('should create and return a new referral', async () => {
        const mockRef = {
          id: 'a0000000-0000-0000-0000-000000000001',
          referrerUserId: 'c0000000-0000-0000-0000-000000000001',
          referralCode: 'REF456',
        }

        ;(mockedDb.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockRef])

        const result = await referralService.create(
          'c0000000-0000-0000-0000-000000000001',
          'REF456',
        )

        expect(result).toEqual(mockRef)
        expect(mockedDb.insert).toHaveBeenCalled()
        expect(mockedDb.values).toHaveBeenCalledWith({
          referrerUserId: 'c0000000-0000-0000-0000-000000000001',
          referralCode: 'REF456',
        })
      })
    })
  })

  describe('contactService', () => {
    describe('list', () => {
      it('should return all contact submissions', async () => {
        const mockSubmissions = [
          {
            id: 'a0000000-0000-0000-0000-000000000001',
            name: 'Alice',
            email: 'alice@example.com',
            subject: 'Help',
            message: 'I need help.',
          },
        ]

        ;(mockedDb.from as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSubmissions)

        const result = await contactService.list()
        expect(result).toEqual(mockSubmissions)
        expect(mockedDb.select).toHaveBeenCalled()
      })
    })

    describe('create', () => {
      it('should create and return a contact submission', async () => {
        const input = {
          name: 'Bob',
          email: 'bob@example.com',
          subject: 'Feedback',
          message: 'Great app!',
        }

        const mockSubmission = {
          id: 'a0000000-0000-0000-0000-000000000002',
          ...input,
          isRead: false,
        }

        ;(mockedDb.returning as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockSubmission])

        const result = await contactService.create(input)
        expect(result).toEqual(mockSubmission)
        expect(mockedDb.insert).toHaveBeenCalled()
        expect(mockedDb.values).toHaveBeenCalledWith({
          name: 'Bob',
          email: 'bob@example.com',
          subject: 'Feedback',
          message: 'Great app!',
        })
      })
    })

    describe('markRead', () => {
      it('should mark a submission as read and return it', async () => {
        const mockUpdated = {
          id: 'a0000000-0000-0000-0000-000000000001',
          isRead: true,
        }

        ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([mockUpdated]),
            }),
          }),
        })

        const result = await contactService.markRead('a0000000-0000-0000-0000-000000000001')
        expect(result).toEqual(mockUpdated)
      })

      it('should return null when submission is not found', async () => {
        ;(mockedDb.update as ReturnType<typeof vi.fn>).mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        })

        const result = await contactService.markRead('a0000000-0000-0000-0000-000000000099')
        expect(result).toBeNull()
      })
    })
  })
})
