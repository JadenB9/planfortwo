import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

import { healthRoute } from './routes/health.js'
import { usersRoute } from './routes/users.js'
import { weddingsRoute } from './routes/weddings.js'

const app = new Hono()

// ── Global Middleware ──
app.use('*', logger())
app.use('*', secureHeaders())
app.use(
  '*',
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ── Routes ──
app.route('/health', healthRoute)
app.route('/users', usersRoute)
app.route('/weddings', weddingsRoute)

// ── 404 Handler ──
app.notFound((c) => {
  return c.json({ error: 'Not Found', code: 'NOT_FOUND', statusCode: 404 }, 404)
})

// ── Error Handler ──
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(
    { error: 'Internal Server Error', code: 'INTERNAL_ERROR', statusCode: 500 },
    500,
  )
})

// ── Server ──
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

if (!isTest) {
  const port = Number(process.env.PORT ?? 3001)

  serve({ fetch: app.fetch, port }, (info) => {
    console.warn(`API server running on http://localhost:${info.port}`)
  })
}

export type AppType = typeof app
export default app
