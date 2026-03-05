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
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  zValidator('json', createVendorSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
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
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  zValidator('json', updateVendorSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const vendorId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await vendorService.update(vendorId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

vendorsRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  async (c) => {
    const vendorId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const deleted = await vendorService.delete(vendorId, weddingId)
    if (!deleted)
      return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: { success: true } })
  },
)

vendorsRoute.get('/:id/communications', resolveWeddingMiddleware, async (c) => {
  const vendorId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const vendor = await vendorService.getById(vendorId, weddingId)
  if (!vendor) return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  const comms = await vendorService.listCommunications(vendorId)
  return c.json({ data: comms })
})

vendorsRoute.post(
  '/:id/communications',
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  zValidator('json', createVendorCommunicationSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const vendorId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const vendor = await vendorService.getById(vendorId, weddingId)
    if (!vendor)
      return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const comm = await vendorService.addCommunication(data)
    return c.json({ data: comm }, 201)
  },
)

vendorsRoute.delete(
  '/communications/:commId',
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  async (c) => {
    const commId = c.req.param('commId')
    const weddingId = c.get('weddingId')
    const comm = await vendorService.getCommunication(commId)
    if (!comm) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const vendor = await vendorService.getById(comm.vendorId, weddingId)
    if (!vendor) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    await vendorService.deleteCommunication(commId)
    return c.json({ data: { success: true } })
  },
)

vendorsRoute.get('/:id/contracts', resolveWeddingMiddleware, async (c) => {
  const vendorId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const vendor = await vendorService.getById(vendorId, weddingId)
  if (!vendor) return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  const contracts = await vendorService.listContracts(vendorId)
  return c.json({ data: contracts })
})

vendorsRoute.post(
  '/:id/contracts',
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  zValidator('json', createVendorContractSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const vendorId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const vendor = await vendorService.getById(vendorId, weddingId)
    if (!vendor)
      return c.json({ error: 'Vendor not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const contract = await vendorService.createContract(data)
    return c.json({ data: contract }, 201)
  },
)

vendorsRoute.put(
  '/contracts/:contractId',
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  zValidator('json', updateVendorContractSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const contractId = c.req.param('contractId')
    const weddingId = c.get('weddingId')
    const contract = await vendorService.getContract(contractId)
    if (!contract)
      return c.json({ error: 'Contract not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const vendor = await vendorService.getById(contract.vendorId, weddingId)
    if (!vendor) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const updated = await vendorService.updateContract(contractId, data)
    if (!updated)
      return c.json({ error: 'Contract not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

vendorsRoute.delete(
  '/contracts/:contractId',
  resolveWeddingMiddleware,
  requireFeature('canVendorManagement'),
  async (c) => {
    const contractId = c.req.param('contractId')
    const weddingId = c.get('weddingId')
    const contract = await vendorService.getContract(contractId)
    if (!contract) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const vendor = await vendorService.getById(contract.vendorId, weddingId)
    if (!vendor) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    await vendorService.deleteContract(contractId)
    return c.json({ data: { success: true } })
  },
)
