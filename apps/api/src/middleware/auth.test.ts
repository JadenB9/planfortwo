import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn(),
}))

import { verifyToken } from '@clerk/backend'
import { authMiddleware } from './auth.js'

const mockedVerifyToken = vi.mocked(verifyToken)

function createApp() {
  const app = new Hono()
  app.use('*', authMiddleware)
  app.get('/protected', (c) => {
    const clerkUserId = c.get('clerkUserId')
    return c.json({ userId: clerkUserId })
  })
  return app
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_123')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
  })

  it('should return 401 when no Authorization header is present', async () => {
    const app = createApp()
    const res = await app.request('/protected')

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
    expect(body.code).toBe('MISSING_TOKEN')
  })

  it('should return 401 when Authorization header has no Bearer prefix', async () => {
    const app = createApp()
    const res = await app.request('/protected', {
      headers: { Authorization: 'Basic abc123' },
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
    expect(body.code).toBe('MISSING_TOKEN')
  })

  it('should return 401 when token verification fails', async () => {
    mockedVerifyToken.mockRejectedValueOnce(new Error('Invalid token'))

    const app = createApp()
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer invalid-token' },
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
    expect(body.code).toBe('INVALID_TOKEN')
  })

  it('should set clerkUserId and call next on valid token', async () => {
    mockedVerifyToken.mockResolvedValueOnce({
      sub: 'user_clerk_abc123',
      iss: 'https://clerk.dev',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nbf: Math.floor(Date.now() / 1000),
    } as Awaited<ReturnType<typeof verifyToken>>)

    const app = createApp()
    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.userId).toBe('user_clerk_abc123')
  })

  it('should pass the token to verifyToken with correct options', async () => {
    mockedVerifyToken.mockResolvedValueOnce({
      sub: 'user_clerk_abc123',
      iss: 'https://clerk.dev',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      nbf: Math.floor(Date.now() / 1000),
    } as Awaited<ReturnType<typeof verifyToken>>)

    const app = createApp()
    await app.request('/protected', {
      headers: { Authorization: 'Bearer my-jwt-token' },
    })

    expect(mockedVerifyToken).toHaveBeenCalledWith('my-jwt-token', {
      secretKey: 'sk_test_123',
      authorizedParties: ['http://localhost:3000'],
    })
  })
})
