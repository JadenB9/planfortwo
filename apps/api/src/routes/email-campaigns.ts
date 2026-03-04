import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createEmailCampaignSchema,
  updateEmailCampaignSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { emailCampaignService, announcementService } from '../services/email-campaigns.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const emailCampaignsRoute = new Hono<Env>()

emailCampaignsRoute.use('*', authMiddleware, resolveUserMiddleware)

emailCampaignsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const campaigns = await emailCampaignService.list(weddingId)
  return c.json({ data: campaigns })
})

emailCampaignsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const campaignId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const campaign = await emailCampaignService.getById(campaignId, weddingId)
  if (!campaign) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: campaign })
})

emailCampaignsRoute.post(
  '/',
  zValidator('json', createEmailCampaignSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const campaign = await emailCampaignService.create(data, dbUserId)
    return c.json({ data: campaign }, 201)
  },
)

emailCampaignsRoute.put(
  '/:id',
  zValidator('json', updateEmailCampaignSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const campaignId = c.req.param('id')
    const weddingId = c.req.query('weddingId')
    if (!weddingId) return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
    const data = c.req.valid('json')
    const updated = await emailCampaignService.update(campaignId, weddingId, data)
    if (!updated) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

emailCampaignsRoute.delete('/:id', async (c) => {
  const campaignId = c.req.param('id')
  const weddingId = c.req.query('weddingId')
  if (!weddingId) return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
  const deleted = await emailCampaignService.delete(campaignId, weddingId)
  if (!deleted) return c.json({ error: 'Campaign not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

emailCampaignsRoute.get('/:id/recipients', async (c) => {
  const campaignId = c.req.param('id')
  const recipients = await emailCampaignService.getRecipients(campaignId)
  return c.json({ data: recipients })
})

export const announcementsRoute = new Hono<Env>()

announcementsRoute.use('*', authMiddleware, resolveUserMiddleware)

announcementsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const list = await announcementService.list(weddingId)
  return c.json({ data: list })
})

announcementsRoute.post(
  '/',
  zValidator('json', createAnnouncementSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const announcement = await announcementService.create(data, dbUserId)
    return c.json({ data: announcement }, 201)
  },
)

announcementsRoute.put(
  '/:id',
  zValidator('json', updateAnnouncementSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const announcementId = c.req.param('id')
    const weddingId = c.req.query('weddingId')
    if (!weddingId) return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
    const data = c.req.valid('json')
    const updated = await announcementService.update(announcementId, weddingId, data)
    if (!updated) return c.json({ error: 'Announcement not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

announcementsRoute.delete('/:id', async (c) => {
  const announcementId = c.req.param('id')
  const weddingId = c.req.query('weddingId')
  if (!weddingId) return c.json({ error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 }, 400)
  const deleted = await announcementService.delete(announcementId, weddingId)
  if (!deleted) return c.json({ error: 'Announcement not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})
