import { describe, it, expect, vi } from 'vitest'

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}))

vi.mock('@planfortwo/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
    transaction: vi.fn(),
  },
  users: {},
  weddings: {},
  weddingMembers: {},
  partnerInvitations: {},
}))

import app from '../index.js'

describe('Health Check API', () => {
  it('should return 200 with health status', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })

  it('should return 404 for unknown routes', async () => {
    const res = await app.request('/unknown')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.error).toBe('Not Found')
    expect(body.code).toBe('NOT_FOUND')
  })
})
