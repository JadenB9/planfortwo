import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockReturnValue({
      type: 'email.received',
      data: {
        email_id: 'resend-email-123',
        from: 'sender@example.com',
        to: ['jabby@planfortwo.com'],
        subject: 'Test inbound email',
      },
    }),
  })),
}))

vi.mock('../services/inbox.js', () => ({
  inboxService: {
    findAddressByLocalPart: vi.fn(),
    storeInboundEmail: vi.fn(),
  },
}))

import { resendWebhookRoute } from './webhooks-resend.js'
import { inboxService } from '../services/inbox.js'

function createApp() {
  const app = new Hono()
  app.route('/webhooks/resend', resendWebhookRoute)
  return app
}

const VALID_HEADERS = {
  'svix-id': 'msg_test123',
  'svix-timestamp': '1234567890',
  'svix-signature': 'v1,test_signature',
}

describe('Resend Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_test_secret')
    vi.stubEnv('RESEND_API_KEY', 'test_api_key')

    vi.mocked(inboxService.findAddressByLocalPart).mockResolvedValue({
      id: 'addr-1',
      userId: 'user-1',
      address: 'jabby',
      displayName: 'Jabby',
      isAdmin: true,
      createdAt: new Date(),
    })

    vi.mocked(inboxService.storeInboundEmail).mockResolvedValue({
      id: 'email-1',
      emailAddressId: 'addr-1',
      direction: 'inbound',
      resendEmailId: 'resend-email-123',
      fromAddress: 'sender@example.com',
      fromName: null,
      toAddress: 'jabby@planfortwo.com',
      ccAddresses: null,
      subject: 'Test inbound email',
      textBody: null,
      htmlBody: null,
      isRead: false,
      isStarred: false,
      messageId: null,
      inReplyToMessageId: null,
      createdAt: new Date(),
    })

    // Mock global fetch for Resend API content fetch
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: 'Email body text', html: '<p>Email body</p>' }),
    }))
  })

  it('stores email for known address', async () => {
    const app = createApp()
    const res = await app.request('/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...VALID_HEADERS },
      body: JSON.stringify({
        type: 'email.received',
        data: {
          email_id: 'resend-email-123',
          from: 'sender@example.com',
          to: ['jabby@planfortwo.com'],
          subject: 'Test inbound email',
        },
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(inboxService.findAddressByLocalPart).toHaveBeenCalledWith('jabby')
    expect(inboxService.storeInboundEmail).toHaveBeenCalledWith('addr-1', expect.objectContaining({
      resendEmailId: 'resend-email-123',
      fromAddress: 'sender@example.com',
      subject: 'Test inbound email',
    }))
  })

  it('skips gracefully for unknown address', async () => {
    vi.mocked(inboxService.findAddressByLocalPart).mockResolvedValue(null)

    const app = createApp()
    const res = await app.request('/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...VALID_HEADERS },
      body: JSON.stringify({
        type: 'email.received',
        data: {
          email_id: 'resend-email-456',
          from: 'sender@example.com',
          to: ['unknown@planfortwo.com'],
          subject: 'Test',
        },
      }),
    })

    expect(res.status).toBe(200)
    expect(inboxService.storeInboundEmail).not.toHaveBeenCalled()
  })

  it('returns 400 for missing signature headers', async () => {
    const app = createApp()
    const res = await app.request('/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email.received', data: {} }),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing signature headers')
  })

  it('returns 400 for invalid signature', async () => {
    const { Webhook } = await import('svix')
    vi.mocked(Webhook).mockImplementation(() => ({
      verify: () => { throw new Error('Invalid signature') },
    }) as never)

    const app = createApp()
    const res = await app.request('/webhooks/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...VALID_HEADERS },
      body: JSON.stringify({ type: 'email.received', data: {} }),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })
})
