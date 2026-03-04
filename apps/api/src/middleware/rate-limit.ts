import type { Context, Next } from 'hono'

const store = new Map<string, { count: number; resetAt: number }>()

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

export function rateLimit(options: { windowMs: number; max: number }) {
  const { windowMs, max } = options

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c)
    const now = Date.now()
    const entry = store.get(ip)

    if (entry && entry.resetAt > now) {
      if (entry.count >= max) {
        return c.json(
          { error: 'Too many requests', code: 'RATE_LIMITED', statusCode: 429 },
          429,
        )
      }
      entry.count++
    } else {
      store.set(ip, { count: 1, resetAt: now + windowMs })
    }

    await next()
  }
}
