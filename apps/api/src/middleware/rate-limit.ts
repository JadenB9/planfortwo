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
  // Use the LAST IP in X-Forwarded-For (set by the trusted proxy/load balancer),
  // not the first (which is client-controlled and spoofable)
  const xff = c.req.header('x-forwarded-for')
  if (xff) {
    const ips = xff.split(',').map((ip) => ip.trim())
    return ips[ips.length - 1] ?? 'unknown'
  }
  return c.req.header('x-real-ip') ?? 'unknown'
}

export function rateLimit(options: { windowMs: number; max: number; prefix?: string }) {
  const { windowMs, max, prefix = 'global' } = options

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c)
    const key = `${prefix}:${ip}`
    const now = Date.now()
    const entry = store.get(key)

    if (entry && entry.resetAt > now) {
      if (entry.count >= max) {
        return c.json({ error: 'Too many requests', code: 'RATE_LIMITED', statusCode: 429 }, 429)
      }
      entry.count++
    } else {
      store.set(key, { count: 1, resetAt: now + windowMs })
    }

    await next()
  }
}
