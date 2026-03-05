import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createRegistryLinkSchema,
  createCashFundSchema,
  updateCashFundSchema,
  createCashFundContributionSchema,
  createGiftSchema,
  updateGiftSchema,
  createMoodBoardSchema,
  createMoodBoardItemSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { registryService } from '../services/registry.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const registryRoute = new Hono<Env>()

registryRoute.use('*', authMiddleware, resolveUserMiddleware)

// Registry Links
registryRoute.get('/links', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const links = await registryService.listLinks(weddingId)
  return c.json({ data: links })
})

registryRoute.post(
  '/links',
  zValidator('json', createRegistryLinkSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const link = await registryService.createLink(data)
    return c.json({ data: link }, 201)
  },
)

registryRoute.delete('/links/:id', resolveWeddingMiddleware, async (c) => {
  const linkId = c.req.param('id')
  const weddingId = c.get('weddingId')
  await registryService.deleteLink(linkId, weddingId)
  return c.json({ data: { success: true } })
})

registryRoute.post('/links/:id/click', resolveWeddingMiddleware, async (c) => {
  const linkId = c.req.param('id')
  await registryService.trackClick(linkId)
  return c.json({ data: { success: true } })
})

// Cash Funds
registryRoute.get('/funds', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const funds = await registryService.listFunds(weddingId)
  return c.json({ data: funds })
})

registryRoute.post(
  '/funds',
  zValidator('json', createCashFundSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const fund = await registryService.createFund(data)
    return c.json({ data: fund }, 201)
  },
)

registryRoute.put(
  '/funds/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateCashFundSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const fundId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await registryService.updateFund(fundId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Fund not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

registryRoute.delete('/funds/:id', resolveWeddingMiddleware, async (c) => {
  const fundId = c.req.param('id')
  const weddingId = c.get('weddingId')
  await registryService.deleteFund(fundId, weddingId)
  return c.json({ data: { success: true } })
})

registryRoute.post(
  '/funds/:id/contribute',
  zValidator('json', createCashFundContributionSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const contribution = await registryService.addContribution(data)
    return c.json({ data: contribution }, 201)
  },
)

// Gifts
registryRoute.get('/gifts', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const gifts = await registryService.listGifts(weddingId)
  return c.json({ data: gifts })
})

registryRoute.post(
  '/gifts',
  zValidator('json', createGiftSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const gift = await registryService.createGift(data)
    return c.json({ data: gift }, 201)
  },
)

registryRoute.put(
  '/gifts/:id',
  resolveWeddingMiddleware,
  zValidator('json', updateGiftSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const giftId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await registryService.updateGift(giftId, weddingId, data)
    if (!updated)
      return c.json({ error: 'Gift not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

registryRoute.delete('/gifts/:id', resolveWeddingMiddleware, async (c) => {
  const giftId = c.req.param('id')
  const weddingId = c.get('weddingId')
  await registryService.deleteGift(giftId, weddingId)
  return c.json({ data: { success: true } })
})

// Mood Boards
registryRoute.get('/mood-boards', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const boards = await registryService.listMoodBoards(weddingId)
  return c.json({ data: boards })
})

registryRoute.post(
  '/mood-boards',
  zValidator('json', createMoodBoardSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const board = await registryService.createMoodBoard(data)
    return c.json({ data: board }, 201)
  },
)

registryRoute.delete('/mood-boards/:id', resolveWeddingMiddleware, async (c) => {
  const boardId = c.req.param('id')
  const weddingId = c.get('weddingId')
  await registryService.deleteMoodBoard(boardId, weddingId)
  return c.json({ data: { success: true } })
})

registryRoute.get('/mood-boards/:id/items', resolveWeddingMiddleware, async (c) => {
  const boardId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const board = await registryService.getMoodBoard(boardId, weddingId)
  if (!board) return c.json({ error: 'Board not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  const items = await registryService.listBoardItems(boardId)
  return c.json({ data: items })
})

registryRoute.post(
  '/mood-boards/:id/items',
  resolveWeddingMiddleware,
  zValidator('json', createMoodBoardItemSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const boardId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const board = await registryService.getMoodBoard(boardId, weddingId)
    if (!board) return c.json({ error: 'Board not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const item = await registryService.addBoardItem(data)
    return c.json({ data: item }, 201)
  },
)

registryRoute.delete('/mood-boards/items/:itemId', resolveWeddingMiddleware, async (c) => {
  const itemId = c.req.param('itemId')
  await registryService.deleteBoardItem(itemId)
  return c.json({ data: { success: true } })
})
