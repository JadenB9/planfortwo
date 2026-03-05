import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'

type AuthEnv = {
  Variables: {
    clerkUserId: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { error: 'Unauthorized', code: 'MISSING_TOKEN', statusCode: 401 },
      401,
    )
  }

  const token = authHeader.slice(7)

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const authorizedParties = [
      appUrl,
      appUrl.replace('://app.', '://'),
    ].filter((v, i, a) => a.indexOf(v) === i) // deduplicate

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties,
    })

    c.set('clerkUserId', payload.sub)
    await next()
  } catch {
    return c.json(
      { error: 'Unauthorized', code: 'INVALID_TOKEN', statusCode: 401 },
      401,
    )
  }
})
