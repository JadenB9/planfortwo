import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { weatherService } from '../services/weather.js'

const weatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().int().min(1).max(16).default(7),
})

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const weatherRoute = new Hono<Env>()

weatherRoute.use('*', authMiddleware, resolveUserMiddleware)

weatherRoute.get(
  '/',
  zValidator('query', weatherQuerySchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const { latitude, longitude, days } = c.req.valid('query')
    const forecast = await weatherService.getForecast(latitude, longitude, days)
    return c.json({ data: forecast })
  },
)
