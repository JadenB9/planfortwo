import { Hono } from 'hono'
import type { HealthCheck } from '@planfortwo/types'

export const healthRoute = new Hono()

healthRoute.get('/', (c) => {
  const health: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      database: 'connected',
      auth: 'connected',
    },
  }
  return c.json(health)
})
