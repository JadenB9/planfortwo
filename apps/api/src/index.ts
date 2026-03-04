import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

import { healthRoute } from './routes/health.js'
import { usersRoute } from './routes/users.js'
import { weddingsRoute } from './routes/weddings.js'
import { tasksRoute } from './routes/tasks.js'
import { categoriesRoute } from './routes/categories.js'
import { dashboardRoute } from './routes/dashboard.js'
import { activityRoute } from './routes/activity.js'
import { featuresRoute } from './routes/features.js'
import { rsvpRoute } from './routes/rsvp.js'
import { guestsRoute } from './routes/guests.js'
import { householdsRoute } from './routes/households.js'
import { guestTagsRoute } from './routes/guest-tags.js'

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
app.route('/tasks', tasksRoute)
app.route('/categories', categoriesRoute)
app.route('/dashboard', dashboardRoute)
app.route('/activity', activityRoute)
app.route('/features', featuresRoute)
app.route('/rsvp', rsvpRoute)
app.route('/guests', guestsRoute)
app.route('/households', householdsRoute)
app.route('/guest-tags', guestTagsRoute)

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
