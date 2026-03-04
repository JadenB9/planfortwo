import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createCeremonyOutlineSchema,
  updateCeremonyOutlineSchema,
  updateVowSchema,
  createProcessionalEntrySchema,
  updateProcessionalEntrySchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { ceremonyService } from '../services/ceremony.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const ceremonyRoute = new Hono<Env>()

ceremonyRoute.use('*', authMiddleware, resolveUserMiddleware)

// ── Outlines ──
ceremonyRoute.get('/outlines', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const outlines = await ceremonyService.listOutlines(weddingId)
  return c.json({ data: outlines })
})

ceremonyRoute.post(
  '/outlines',
  resolveWeddingMiddleware,
  zValidator('json', createCeremonyOutlineSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const outline = await ceremonyService.createOutline(data)
    return c.json({ data: outline }, 201)
  },
)

ceremonyRoute.put(
  '/outlines/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateCeremonyOutlineSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await ceremonyService.updateOutline(id, weddingId, data)
    if (!updated) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

ceremonyRoute.delete('/outlines/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await ceremonyService.deleteOutline(id, weddingId)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

// ── Vows ──
ceremonyRoute.get('/vows', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const userId = c.get('dbUserId')
  const vow = await ceremonyService.getVow(weddingId, userId)
  return c.json({ data: vow })
})

ceremonyRoute.put(
  '/vows',
  resolveWeddingMiddleware,
  zValidator('json', updateVowSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const weddingId = c.get('weddingId')
    const userId = c.get('dbUserId')
    const data = c.req.valid('json')
    const vow = await ceremonyService.upsertVow(weddingId, userId, data)
    return c.json({ data: vow })
  },
)

// ── Processional ──
ceremonyRoute.get('/processional', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const entries = await ceremonyService.listProcessional(weddingId)
  return c.json({ data: entries })
})

ceremonyRoute.post(
  '/processional',
  resolveWeddingMiddleware,
  zValidator('json', createProcessionalEntrySchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const entry = await ceremonyService.createProcessionalEntry(data)
    return c.json({ data: entry }, 201)
  },
)

ceremonyRoute.put(
  '/processional/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateProcessionalEntrySchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await ceremonyService.updateProcessionalEntry(id, weddingId, data)
    if (!updated) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

ceremonyRoute.delete('/processional/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await ceremonyService.deleteProcessionalEntry(id, weddingId)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})
