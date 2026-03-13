import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  sql: Object.assign(vi.fn(), { join: vi.fn() }),
  count: vi.fn(),
}))

vi.mock('@planfortwo/db', () => {
  const mockReturning = vi.fn()
  const mockValues = vi.fn(() => ({ returning: mockReturning }))
  const mockInsert = vi.fn(() => ({ values: mockValues }))

  const mockLimit = vi.fn()
  const mockWhere = vi.fn(() => ({ limit: mockLimit }))
  const mockFrom = vi.fn(() => ({ where: mockWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))

  const mockTransaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({ select: mockSelect, insert: mockInsert }),
  )
  return {
    db: {
      select: mockSelect,
      transaction: mockTransaction,
      insert: mockInsert,
      _mocks: {
        mockSelect,
        mockFrom,
        mockWhere,
        mockLimit,
        mockInsert,
        mockValues,
        mockReturning,
        mockTransaction,
      },
    },
    emailAddresses: {
      id: 'id',
      userId: 'userId',
      address: 'address',
      displayName: 'displayName',
      isAdmin: 'isAdmin',
      createdAt: 'createdAt',
    },
    emails: {
      id: 'id',
      emailAddressId: 'emailAddressId',
      direction: 'direction',
      isRead: 'isRead',
      subject: 'subject',
      fromAddress: 'fromAddress',
      toAddress: 'toAddress',
      createdAt: 'createdAt',
    },
  }
})

import { db } from '@planfortwo/db'
import { inboxService } from './inbox.js'

const mocks = (db as unknown as { _mocks: Record<string, ReturnType<typeof vi.fn>> })._mocks

describe('Inbox Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup chaining after clearing
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning })
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues })
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit })
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere })
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom })
  })

  describe('listAddresses', () => {
    it('queries addresses by userId', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          userId: 'user-1',
          address: 'jabby',
          displayName: 'Jabby',
          isAdmin: false,
          createdAt: new Date(),
        },
      ]
      mocks.mockWhere.mockResolvedValueOnce(mockAddresses)

      const result = await inboxService.listAddresses('user-1')

      expect(result).toEqual(mockAddresses)
      expect(mocks.mockSelect).toHaveBeenCalled()
      expect(mocks.mockFrom).toHaveBeenCalled()
      expect(mocks.mockWhere).toHaveBeenCalled()
    })
  })

  describe('claimAddress', () => {
    it('rejects reserved addresses', async () => {
      await expect(
        inboxService.claimAddress('user-1', { address: 'admin', displayName: 'Admin' }),
      ).rejects.toThrow('This address is reserved')
    })

    it('rejects when user already has an address', async () => {
      // First query (check existing for user) returns a result
      mocks.mockLimit.mockResolvedValueOnce([
        {
          id: 'addr-1',
          userId: 'user-1',
          address: 'existing',
          displayName: 'Existing',
          isAdmin: false,
          createdAt: new Date(),
        },
      ])

      await expect(
        inboxService.claimAddress('user-1', { address: 'newname', displayName: 'New' }),
      ).rejects.toThrow('You already have a claimed email address')
    })
  })

  describe('checkAddressAvailability', () => {
    it('returns false for reserved addresses', async () => {
      const result = await inboxService.checkAddressAvailability('support')

      expect(result.available).toBe(false)
      expect(result.reason).toBe('This address is reserved')
    })

    it('returns true for available addresses', async () => {
      mocks.mockLimit.mockResolvedValueOnce([])

      const result = await inboxService.checkAddressAvailability('newuser')

      expect(result.available).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  describe('findAddressByLocalPart', () => {
    it('returns null when not found', async () => {
      mocks.mockLimit.mockResolvedValueOnce([])

      const result = await inboxService.findAddressByLocalPart('nonexistent')

      expect(result).toBeNull()
    })

    it('returns address when found', async () => {
      const mockAddress = {
        id: 'addr-1',
        userId: 'user-1',
        address: 'jabby',
        displayName: 'Jabby',
        isAdmin: true,
        createdAt: new Date(),
      }
      mocks.mockLimit.mockResolvedValueOnce([mockAddress])

      const result = await inboxService.findAddressByLocalPart('Jabby')

      expect(result).toEqual(mockAddress)
    })
  })

  describe('storeInboundEmail', () => {
    it('inserts email record and returns it', async () => {
      const mockEmail = {
        id: 'email-1',
        emailAddressId: 'addr-1',
        direction: 'inbound',
        resendEmailId: 'resend-123',
        fromAddress: 'sender@example.com',
        fromName: 'Sender',
        toAddress: 'jabby@planfortwo.com',
        ccAddresses: null,
        subject: 'Hello',
        textBody: 'Hello there',
        htmlBody: null,
        isRead: false,
        isStarred: false,
        messageId: null,
        inReplyToMessageId: null,
        createdAt: new Date(),
      }
      mocks.mockReturning.mockResolvedValueOnce([mockEmail])

      const result = await inboxService.storeInboundEmail('addr-1', {
        resendEmailId: 'resend-123',
        fromAddress: 'sender@example.com',
        fromName: 'Sender',
        toAddress: 'jabby@planfortwo.com',
        subject: 'Hello',
        textBody: 'Hello there',
      })

      expect(result).toEqual(mockEmail)
      expect(mocks.mockInsert).toHaveBeenCalled()
      expect(mocks.mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          emailAddressId: 'addr-1',
          direction: 'inbound',
          resendEmailId: 'resend-123',
          fromAddress: 'sender@example.com',
          fromName: 'Sender',
          toAddress: 'jabby@planfortwo.com',
          subject: 'Hello',
          textBody: 'Hello there',
        }),
      )
    })
  })

  describe('getUnreadCount', () => {
    it('returns 0 when user has no addresses', async () => {
      mocks.mockWhere.mockResolvedValueOnce([])

      const result = await inboxService.getUnreadCount('user-no-addresses')

      expect(result).toBe(0)
    })
  })
})
