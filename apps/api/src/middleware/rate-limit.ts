import type { Context, Next } from 'hono'

const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  },
  5 * 60 * 1000,
).unref()

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
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
        return c.json({ error: 'Too many requests', code: 'RATE_LIMITED', statusCode: 429 }, 429)
      }
      entry.count++
    } else {
      store.set(ip, { count: 1, resetAt: now + windowMs })
    }

    await next()
  }
}
