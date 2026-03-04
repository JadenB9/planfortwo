import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createVendorSchema,
  updateVendorSchema,
  createVendorCommunicationSchema,
  createVendorContractSchema,
  updateVendorContractSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { vendorService } from '../services/vendors.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const vendorsRoute = new Hono<Env>()

vendorsRoute.use('*', authMiddleware, resolveUserMiddleware)

vendorsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const list = await vendorService.list(weddingId)
  return c.json({ data: list })
})

vendorsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const vendorId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const vendor = await vendorService.getById(vendorId, weddingId)
  if (!vendor) return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: vendor })
})

vendorsRoute.post(
  '/',
  requireFeature('canVendorManagement'),
  zValidator('json', createVendorSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const vendor = await vendorService.create(data, dbUserId)
    return c.json({ data: vendor }, 201)
  },
)

vendorsRoute.put(
  '/:id',
  requireFeature('canVendorManagement'),
  zValidator('json', updateVendorSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const vendorId = c.req.param('id')
    const weddingId = c.req.query('weddingId')
    if (!weddingId) return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
    const data = c.req.valid('json')
    const updated = await vendorService.update(vendorId, weddingId, data)
    if (!updated) return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

vendorsRoute.delete('/:id', requireFeature('canVendorManagement'), async (c) => {
  const vendorId = c.req.param('id')
  const weddingId = c.req.query('weddingId')
  if (!weddingId) return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
  const deleted = await vendorService.delete(vendorId, weddingId)
  if (!deleted) return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

vendorsRoute.get('/:id/communications', async (c) => {
  const vendorId = c.req.param('id')
  const comms = await vendorService.listCommunications(vendorId)
  return c.json({ data: comms })
})

vendorsRoute.post(
  '/:id/communications',
  requireFeature('canVendorManagement'),
  zValidator('json', createVendorCommunicationSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const comm = await vendorService.addCommunication(data)
    return c.json({ data: comm }, 201)
  },
)

vendorsRoute.delete('/communications/:commId', requireFeature('canVendorManagement'), async (c) => {
  const commId = c.req.param('commId')
  await vendorService.deleteCommunication(commId)
  return c.json({ data: { success: true } })
})

vendorsRoute.get('/:id/contracts', async (c) => {
  const vendorId = c.req.param('id')
  const contracts = await vendorService.listContracts(vendorId)
  return c.json({ data: contracts })
})

vendorsRoute.post(
  '/:id/contracts',
  requireFeature('canVendorManagement'),
  zValidator('json', createVendorContractSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const contract = await vendorService.createContract(data)
    return c.json({ data: contract }, 201)
  },
)

vendorsRoute.put(
  '/contracts/:contractId',
  requireFeature('canVendorManagement'),
  zValidator('json', updateVendorContractSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const contractId = c.req.param('contractId')
    const data = c.req.valid('json')
    const updated = await vendorService.updateContract(contractId, data)
    if (!updated) return c.json({ error: 'Contract not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

vendorsRoute.delete('/contracts/:contractId', requireFeature('canVendorManagement'), async (c) => {
  const contractId = c.req.param('contractId')
  await vendorService.deleteContract(contractId)
  return c.json({ data: { success: true } })
})
