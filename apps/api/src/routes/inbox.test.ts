import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jaden',
      lastName: 'Butler',
    }),
  },
}))

vi.mock('../services/inbox.js', () => ({
  inboxService: {
    listAddresses: vi.fn(),
    claimAddress: vi.fn(),
    checkAddressAvailability: vi.fn(),
    listEmails: vi.fn(),
    getEmail: vi.fn(),
    updateEmail: vi.fn(),
    deleteEmail: vi.fn(),
    sendEmail: vi.fn(),
    getUnreadCount: vi.fn(),
    getAttachmentDownloadUrl: vi.fn(),
  },
}))

import { inboxRoute } from './inbox.js'
import { inboxService } from '../services/inbox.js'

function createApp() {
  const app = new Hono()
  app.route('/inbox', inboxRoute)
  return app
}

const authHeaders = () => ({
  Authorization: 'Bearer test-jwt-token',
  'Content-Type': 'application/json',
})

const MOCK_ADDRESS = {
  id: 'a0000000-0000-0000-0000-000000000001',
  userId: 'db-user-id',
  address: 'jabby',
  displayName: 'Jabby',
  isAdmin: true,
  createdAt: new Date(),
}

const MOCK_EMAIL = {
  id: 'e0000000-0000-0000-0000-000000000001',
  emailAddressId: MOCK_ADDRESS.id,
  direction: 'inbound' as const,
  resendEmailId: 'resend-123',
  fromAddress: 'sender@example.com',
  fromName: 'Sender',
  toAddress: 'jabby@planfortwo.com',
  ccAddresses: null,
  subject: 'Test Email',
  textBody: 'Hello world',
  htmlBody: null,
  isRead: false,
  isStarred: false,
  messageId: null,
  inReplyToMessageId: null,
  replyTo: null,
  createdAt: new Date(),
}

describe('Inbox Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')

    vi.mocked(inboxService.listAddresses).mockResolvedValue([MOCK_ADDRESS])
    vi.mocked(inboxService.claimAddress).mockResolvedValue(MOCK_ADDRESS)
    vi.mocked(inboxService.checkAddressAvailability).mockResolvedValue({
      available: true,
      reason: undefined,
    })
    vi.mocked(inboxService.listEmails).mockResolvedValue({
      data: [MOCK_EMAIL],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    })
    vi.mocked(inboxService.getEmail).mockResolvedValue(MOCK_EMAIL)
    vi.mocked(inboxService.updateEmail).mockResolvedValue({ ...MOCK_EMAIL, isRead: true })
    vi.mocked(inboxService.deleteEmail).mockResolvedValue(true)
    vi.mocked(inboxService.sendEmail).mockResolvedValue({
      ...MOCK_EMAIL,
      direction: 'outbound',
      fromAddress: 'jabby@planfortwo.com',
      toAddress: 'recipient@example.com',
    })
    vi.mocked(inboxService.getUnreadCount).mockResolvedValue(3)
    vi.mocked(inboxService.getAttachmentDownloadUrl).mockResolvedValue({
      url: 'https://r2.example.com/file.pdf',
    })
  })

  // ── Addresses ──
  describe('GET /inbox/addresses', () => {
    it('lists user addresses', async () => {
      const app = createApp()
      const res = await app.request('/inbox/addresses', { headers: authHeaders() })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(1)
      expect(json.data[0].address).toBe('jabby')
    })

    it('requires auth', async () => {
      const app = createApp()
      const res = await app.request('/inbox/addresses')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /inbox/addresses', () => {
    it('claims a new address', async () => {
      const app = createApp()
      const res = await app.request('/inbox/addresses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ address: 'jabby', displayName: 'Jabby' }),
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.data.address).toBe('jabby')
    })

    it('rejects invalid address format', async () => {
      const app = createApp()
      const res = await app.request('/inbox/addresses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ address: 'a', displayName: 'Too Short' }),
      })

      expect(res.status).toBe(400)
    })

    it('returns 400 when claim fails', async () => {
      vi.mocked(inboxService.claimAddress).mockRejectedValue(new Error('Already taken'))

      const app = createApp()
      const res = await app.request('/inbox/addresses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ address: 'taken', displayName: 'Name' }),
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Already taken')
    })
  })

  describe('GET /inbox/addresses/check', () => {
    it('checks address availability', async () => {
      const app = createApp()
      const res = await app.request('/inbox/addresses/check?address=newname', {
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.available).toBe(true)
    })
  })

  // ── Unread count ──
  describe('GET /inbox/unread-count', () => {
    it('returns unread count', async () => {
      const app = createApp()
      const res = await app.request('/inbox/unread-count', { headers: authHeaders() })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.count).toBe(3)
    })
  })

  // ── List emails ──
  describe('GET /inbox', () => {
    it('lists emails with default filters', async () => {
      const app = createApp()
      const res = await app.request('/inbox', { headers: authHeaders() })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(1)
      expect(json.total).toBe(1)
    })

    it('filters by direction', async () => {
      const app = createApp()
      await app.request('/inbox?direction=inbound', { headers: authHeaders() })

      expect(inboxService.listEmails).toHaveBeenCalledWith(
        'db-user-id',
        expect.objectContaining({ direction: 'inbound' }),
      )
    })
  })

  // ── Get single email ──
  describe('GET /inbox/:id', () => {
    it('returns a single email', async () => {
      const app = createApp()
      const res = await app.request(`/inbox/${MOCK_EMAIL.id}`, { headers: authHeaders() })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.subject).toBe('Test Email')
    })

    it('returns 404 for non-existent email', async () => {
      vi.mocked(inboxService.getEmail).mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/inbox/e0000000-0000-0000-0000-000000000099', {
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
    })
  })

  // ── Update email ──
  describe('PATCH /inbox/:id', () => {
    it('updates read status', async () => {
      const app = createApp()
      const res = await app.request(`/inbox/${MOCK_EMAIL.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isRead: true }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.isRead).toBe(true)
    })

    it('returns 404 for non-existent email', async () => {
      vi.mocked(inboxService.updateEmail).mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/inbox/e0000000-0000-0000-0000-000000000099', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ isStarred: true }),
      })

      expect(res.status).toBe(404)
    })
  })

  // ── Delete email ──
  describe('DELETE /inbox/:id', () => {
    it('deletes an email', async () => {
      const app = createApp()
      const res = await app.request(`/inbox/${MOCK_EMAIL.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.success).toBe(true)
    })

    it('returns 404 for non-existent email', async () => {
      vi.mocked(inboxService.deleteEmail).mockResolvedValue(false)

      const app = createApp()
      const res = await app.request('/inbox/e0000000-0000-0000-0000-000000000099', {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
    })
  })

  // ── Send email ──
  describe('POST /inbox/send', () => {
    it('sends an email', async () => {
      const app = createApp()
      const res = await app.request('/inbox/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          emailAddressId: MOCK_ADDRESS.id,
          toAddress: 'recipient@example.com',
          subject: 'Hello',
          textBody: 'Hi there!',
        }),
      })

      expect(res.status).toBe(201)
    })

    it('validates required fields', async () => {
      const app = createApp()
      const res = await app.request('/inbox/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ toAddress: 'bad' }),
      })

      expect(res.status).toBe(400)
    })
  })
})
