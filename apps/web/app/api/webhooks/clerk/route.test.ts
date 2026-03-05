import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn(),
  })),
}))

vi.mock('@planfortwo/db', () => ({
  db: {
    transaction: vi.fn(),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
  users: { clerkId: 'clerkId' },
  weddings: {},
  weddingMembers: {},
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}))

import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { POST } from './route'

const mockedHeaders = vi.mocked(headers)
const mockedWebhookInstance = { verify: vi.fn() }
const MockedWebhook = vi.mocked(Webhook)

function createRequest(body: unknown, headerOverrides: Record<string, string> = {}) {
  const defaultHeaders: Record<string, string> = {
    'svix-id': 'msg_test123',
    'svix-timestamp': String(Math.floor(Date.now() / 1000)),
    'svix-signature': 'v1,test-signature',
    'content-type': 'application/json',
    ...headerOverrides,
  }

  return new Request('http://localhost:3000/api/webhooks/clerk', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body),
  })
}

describe('Clerk Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_WEBHOOK_SECRET', 'whsec_test123')
    MockedWebhook.mockImplementation(
      () => mockedWebhookInstance as unknown as InstanceType<typeof Webhook>,
    )
  })

  it('should return 400 when svix-id header is missing', async () => {
    const headerMap = new Map([
      ['svix-timestamp', String(Math.floor(Date.now() / 1000))],
      ['svix-signature', 'v1,test-signature'],
    ])
    mockedHeaders.mockResolvedValue({
      get: (name: string) => headerMap.get(name) ?? null,
    } as Awaited<ReturnType<typeof headers>>)

    const req = createRequest({ type: 'user.created', data: {} })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Missing required Svix headers')
  })

  it('should return 400 when signature verification fails', async () => {
    const headerMap = new Map([
      ['svix-id', 'msg_test123'],
      ['svix-timestamp', String(Math.floor(Date.now() / 1000))],
      ['svix-signature', 'v1,test-signature'],
    ])
    mockedHeaders.mockResolvedValue({
      get: (name: string) => headerMap.get(name) ?? null,
    } as Awaited<ReturnType<typeof headers>>)

    mockedWebhookInstance.verify.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const req = createRequest({ type: 'user.created', data: {} })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid webhook signature')
  })

  it('should handle user.created event and return 200', async () => {
    const headerMap = new Map([
      ['svix-id', 'msg_test123'],
      ['svix-timestamp', String(Math.floor(Date.now() / 1000))],
      ['svix-signature', 'v1,test-signature'],
    ])
    mockedHeaders.mockResolvedValue({
      get: (name: string) => headerMap.get(name) ?? null,
    } as Awaited<ReturnType<typeof headers>>)

    const eventPayload = {
      type: 'user.created',
      data: {
        id: 'user_clerk_abc',
        email_addresses: [{ email_address: 'test@example.com' }],
        first_name: 'Jane',
        last_name: 'Doe',
        image_url: 'https://img.clerk.com/avatar.png',
      },
    }

    mockedWebhookInstance.verify.mockReturnValue(eventPayload)

    const { db } = await import('@planfortwo/db')
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      const mockTx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValueOnce([{ id: 'user-1', clerkId: 'user_clerk_abc' }])
              .mockResolvedValueOnce([{ id: 'wedding-1' }]),
          }),
        }),
      }
      // The third insert (weddingMembers) doesn't need returning
      let insertCount = 0
      mockTx.insert = vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => {
          insertCount++
          if (insertCount <= 2) {
            return {
              returning: vi
                .fn()
                .mockResolvedValue(
                  insertCount === 1
                    ? [{ id: 'user-1', clerkId: 'user_clerk_abc' }]
                    : [{ id: 'wedding-1' }],
                ),
            }
          }
          return { returning: vi.fn().mockResolvedValue([]) }
        }),
      }))
      await fn(mockTx as never)
    })

    const req = createRequest(eventPayload)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(db.transaction).toHaveBeenCalled()
  })

  it('should handle user.updated event and return 200', async () => {
    const headerMap = new Map([
      ['svix-id', 'msg_test123'],
      ['svix-timestamp', String(Math.floor(Date.now() / 1000))],
      ['svix-signature', 'v1,test-signature'],
    ])
    mockedHeaders.mockResolvedValue({
      get: (name: string) => headerMap.get(name) ?? null,
    } as Awaited<ReturnType<typeof headers>>)

    const eventPayload = {
      type: 'user.updated',
      data: {
        id: 'user_clerk_abc',
        email_addresses: [{ email_address: 'updated@example.com' }],
        first_name: 'Janet',
        last_name: 'Doe',
        image_url: 'https://img.clerk.com/new-avatar.png',
      },
    }

    mockedWebhookInstance.verify.mockReturnValue(eventPayload)

    const req = createRequest(eventPayload)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  it('should handle user.deleted event and return 200', async () => {
    const headerMap = new Map([
      ['svix-id', 'msg_test123'],
      ['svix-timestamp', String(Math.floor(Date.now() / 1000))],
      ['svix-signature', 'v1,test-signature'],
    ])
    mockedHeaders.mockResolvedValue({
      get: (name: string) => headerMap.get(name) ?? null,
    } as Awaited<ReturnType<typeof headers>>)

    const eventPayload = {
      type: 'user.deleted',
      data: { id: 'user_clerk_abc' },
    }

    mockedWebhookInstance.verify.mockReturnValue(eventPayload)

    const req = createRequest(eventPayload)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })

  it('should return 200 for unhandled event types', async () => {
    const headerMap = new Map([
      ['svix-id', 'msg_test123'],
      ['svix-timestamp', String(Math.floor(Date.now() / 1000))],
      ['svix-signature', 'v1,test-signature'],
    ])
    mockedHeaders.mockResolvedValue({
      get: (name: string) => headerMap.get(name) ?? null,
    } as Awaited<ReturnType<typeof headers>>)

    const eventPayload = {
      type: 'session.created',
      data: { id: 'sess_123' },
    }

    mockedWebhookInstance.verify.mockReturnValue(eventPayload)

    const req = createRequest(eventPayload)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
