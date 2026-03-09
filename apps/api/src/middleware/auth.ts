import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import { timingSafeEqual } from 'node:crypto'

type AuthEnv = {
  Variables: {
    clerkUserId: string
  }
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  // Check for MCP API key authentication
  const apiKey = c.req.header('X-API-Key')
  const configuredApiKey = process.env.PLANFORTWO_API_KEY
  const mcpClerkUserId = process.env.MCP_CLERK_USER_ID

  if (apiKey && configuredApiKey && mcpClerkUserId) {
    if (safeCompare(apiKey, configuredApiKey)) {
      c.set('clerkUserId', mcpClerkUserId)
      await next()
      return
    }
    return c.json({ error: 'Unauthorized', code: 'INVALID_API_KEY', statusCode: 401 }, 401)
  }

  // Standard Clerk JWT authentication
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', code: 'MISSING_TOKEN', statusCode: 401 }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not configured')
      return c.json({ error: 'Server misconfigured', code: 'SERVER_ERROR', statusCode: 500 }, 500)
    }
    const authorizedParties = [appUrl, appUrl.replace('://app.', '://')].filter(
      (v, i, a) => a.indexOf(v) === i,
    ) // deduplicate

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties,
    })

    c.set('clerkUserId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized', code: 'INVALID_TOKEN', statusCode: 401 }, 401)
  }
})
