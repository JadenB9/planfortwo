import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createSeatingChartSchema,
  updateSeatingChartSchema,
  createSeatingTableSchema,
  updateSeatingTableSchema,
  createVenueElementSchema,
  assignGuestSchema,
  createGuestRelationshipSchema,
  cloneChartSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { seatingChartService } from '../services/seating-charts.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const seatingChartsRoute = new Hono<Env>()

seatingChartsRoute.use('*', authMiddleware, resolveUserMiddleware)

seatingChartsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const charts = await seatingChartService.listCharts(weddingId)
  return c.json({ data: charts })
})

seatingChartsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const chartId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const chart = await seatingChartService.getChart(chartId, weddingId)
  if (!chart) return c.json({ error: 'Chart not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: chart })
})

seatingChartsRoute.post(
  '/',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', createSeatingChartSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const chart = await seatingChartService.createChart(data, dbUserId)
    return c.json({ data: chart }, 201)
  },
)

seatingChartsRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', updateSeatingChartSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const chartId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await seatingChartService.updateChart(chartId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Chart not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

seatingChartsRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  async (c) => {
    const chartId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const deleted = await seatingChartService.deleteChart(chartId, weddingId)
    if (!deleted)
      return c.json({ error: 'Chart not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: { success: true } })
  },
)

seatingChartsRoute.post(
  '/:id/tables',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', createSeatingTableSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const chartId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const chart = await seatingChartService.getChart(chartId, weddingId)
    if (!chart) return c.json({ error: 'Chart not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const table = await seatingChartService.addTable(data)
    return c.json({ data: table }, 201)
  },
)

seatingChartsRoute.put(
  '/tables/:tableId',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', updateSeatingTableSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const tableId = c.req.param('tableId')
    const data = c.req.valid('json')
    const updated = await seatingChartService.updateTable(tableId, data)
    if (!updated)
      return c.json({ error: 'Table not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

seatingChartsRoute.delete(
  '/tables/:tableId',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  async (c) => {
    const tableId = c.req.param('tableId')
    await seatingChartService.deleteTable(tableId)
    return c.json({ data: { success: true } })
  },
)

seatingChartsRoute.post(
  '/:id/elements',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', createVenueElementSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const chartId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const chart = await seatingChartService.getChart(chartId, weddingId)
    if (!chart) return c.json({ error: 'Chart not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const element = await seatingChartService.addElement(data)
    return c.json({ data: element }, 201)
  },
)

seatingChartsRoute.delete(
  '/elements/:elementId',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  async (c) => {
    const elementId = c.req.param('elementId')
    await seatingChartService.deleteElement(elementId)
    return c.json({ data: { success: true } })
  },
)

seatingChartsRoute.post(
  '/assignments',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', assignGuestSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const assignment = await seatingChartService.assignGuest(data)
    return c.json({ data: assignment }, 201)
  },
)

seatingChartsRoute.delete(
  '/assignments/:id',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  async (c) => {
    const id = c.req.param('id')
    await seatingChartService.unassignSeat(id)
    return c.json({ data: { success: true } })
  },
)

seatingChartsRoute.get('/:id/conflicts', resolveWeddingMiddleware, async (c) => {
  const chartId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const result = await seatingChartService.checkConflicts(chartId, weddingId)
  return c.json({ data: result })
})

seatingChartsRoute.post(
  '/:id/clone',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', cloneChartSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const chartId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const { name } = c.req.valid('json')
    const cloned = await seatingChartService.cloneChart(chartId, weddingId, name)
    if (!cloned)
      return c.json({ error: 'Chart not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: cloned }, 201)
  },
)

seatingChartsRoute.get('/relationships', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const relationships = await seatingChartService.listRelationships(weddingId)
  return c.json({ data: relationships })
})

seatingChartsRoute.post(
  '/relationships',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  zValidator('json', createGuestRelationshipSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const relationship = await seatingChartService.createRelationship(data)
    return c.json({ data: relationship }, 201)
  },
)

seatingChartsRoute.delete(
  '/relationships/:id',
  resolveWeddingMiddleware,
  requireFeature('canSeatingChart'),
  async (c) => {
    const id = c.req.param('id')
    await seatingChartService.deleteRelationship(id)
    return c.json({ data: { success: true } })
  },
)
