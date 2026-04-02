import type { Context, Next } from 'hono'
import { lt, sql } from 'drizzle-orm'
import { db, rateLimitBuckets } from '@planfortwo/db'
import { getClientIdentifier } from '../utils/request-client.js'

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanupAt = 0

interface RateLimitResult {
  count: number
  remaining: number
  resetAt: number
  limited: boolean
}

async function maybeCleanupExpiredBuckets(nowMs: number) {
  if (nowMs - lastCleanupAt < CLEANUP_INTERVAL_MS) return
  lastCleanupAt = nowMs

  try {
    await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.expiresAt, new Date(nowMs)))
  } catch (err) {
    console.warn('Rate limit cleanup failed', err)
  }
}

function buildRateLimitHeaders(result: RateLimitResult, max: number) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(max),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }

  if (result.limited) {
    headers['Retry-After'] = String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)))
  }

  return headers
}

export async function consumeRateLimit(
  key: string,
  windowMs: number,
  max: number,
): Promise<RateLimitResult> {
  const nowMs = Date.now()
  const windowStartedAtMs = Math.floor(nowMs / windowMs) * windowMs
  const resetAt = windowStartedAtMs + windowMs
  const expiresAt = new Date(resetAt + windowMs)

  await maybeCleanupExpiredBuckets(nowMs)

  const [bucket] = await db
    .insert(rateLimitBuckets)
    .values({
      key,
      windowStartedAt: new Date(windowStartedAtMs),
      hits: 1,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.windowStartedAt],
      set: {
        hits: sql`${rateLimitBuckets.hits} + 1`,
        expiresAt,
        updatedAt: sql`now()`,
      },
    })
    .returning({ hits: rateLimitBuckets.hits })

  const count = bucket?.hits ?? 1

  return {
    count,
    remaining: Math.max(0, max - count),
    resetAt,
    limited: count > max,
  }
}

export function rateLimit(options: { windowMs: number; max: number; prefix?: string }) {
  const { windowMs, max, prefix = 'global' } = options

  return async (c: Context, next: Next) => {
    try {
      const key = `${prefix}:${getClientIdentifier(c)}`
      const result = await consumeRateLimit(key, windowMs, max)
      const headers = buildRateLimitHeaders(result, max)

      if (result.limited) {
        return c.json(
          { error: 'Too many requests', code: 'RATE_LIMITED', statusCode: 429 },
          429,
          headers,
        )
      }

      await next()

      for (const [header, value] of Object.entries(headers)) {
        c.res.headers.set(header, value)
      }
    } catch (err) {
      console.warn('Rate limit check failed, allowing request', err)
      await next()
    }
  }
}
