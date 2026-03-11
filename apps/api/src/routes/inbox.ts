import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  claimAddressSchema,
  composeEmailSchema,
  updateEmailSchema,
  inboxFiltersSchema,
  emailLocalPartSchema,
} from '@planfortwo/validators'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { inboxService } from '../services/inbox.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const inboxRoute = new Hono<Env>()

inboxRoute.use('*', authMiddleware, resolveUserMiddleware)

// ── Addresses (static paths first) ──
inboxRoute.get('/addresses', async (c) => {
  const userId = c.get('dbUserId')
  const addresses = await inboxService.listAddresses(userId)
  return c.json({ data: addresses })
})

inboxRoute.post(
  '/addresses',
  zValidator('json', claimAddressSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const data = c.req.valid('json')
    try {
      const address = await inboxService.claimAddress(userId, data)
      return c.json({ data: address }, 201)
    } catch (err) {
      console.error('Claim address failed:', err)
      return c.json(
        { error: 'Failed to claim address', code: 'CLAIM_FAILED', statusCode: 400 },
        400,
      )
    }
  },
)

inboxRoute.get(
  '/addresses/check',
  zValidator('query', z.object({ address: emailLocalPartSchema }), (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const { address } = c.req.valid('query')
    const result = await inboxService.checkAddressAvailability(address)
    return c.json({ data: result })
  },
)

// ── Unread count ──
inboxRoute.get('/unread-count', async (c) => {
  const userId = c.get('dbUserId')
  const count = await inboxService.getUnreadCount(userId)
  return c.json({ data: { count } })
})

// ── Attachment download ──
inboxRoute.get('/attachments/:attachmentId', async (c) => {
  const userId = c.get('dbUserId')
  const attachmentId = c.req.param('attachmentId')

  const result = await inboxService.getAttachmentDownloadUrl(userId, attachmentId)
  if (!result) {
    return c.json({ error: 'Attachment not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  return c.redirect(result.url)
})

// ── Upload URL for attachments ──
inboxRoute.post(
  '/upload-url',
  zValidator(
    'json',
    z.object({
      emailAddressId: z.string().uuid(),
      fileName: z.string().min(1).max(255),
      contentType: z
        .string()
        .regex(
          /^(image\/(jpeg|png|gif|webp|heic|heif)|application\/pdf)$/,
          'Must be an image (JPEG, PNG, GIF, WebP, HEIC) or PDF',
        ),
    }),
    (result, c) => {
      if (!result.success)
        return c.json(
          { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
          400,
        )
    },
  ),
  async (c) => {
    const userId = c.get('dbUserId')
    const { emailAddressId, fileName, contentType } = c.req.valid('json')
    try {
      const result = await inboxService.getAttachmentUploadUrl(
        userId,
        emailAddressId,
        fileName,
        contentType,
      )
      return c.json({ data: result })
    } catch (err) {
      console.error('Get upload URL failed:', err)
      return c.json(
        { error: 'Failed to get upload URL', code: 'UPLOAD_URL_FAILED', statusCode: 400 },
        400,
      )
    }
  },
)

// ── Send ──
inboxRoute.post(
  '/send',
  zValidator('json', composeEmailSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const data = c.req.valid('json')
    try {
      const email = await inboxService.sendEmail(userId, data)
      return c.json({ data: email }, 201)
    } catch (err) {
      console.error('Send email failed:', err)
      return c.json({ error: 'Failed to send email', code: 'SEND_FAILED', statusCode: 400 }, 400)
    }
  },
)

// ── List emails ──
inboxRoute.get(
  '/',
  zValidator('query', inboxFiltersSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const filters = c.req.valid('query')
    const result = await inboxService.listEmails(userId, filters)
    return c.json(result)
  },
)

// ── Single email ──
inboxRoute.get('/:id', async (c) => {
  const userId = c.get('dbUserId')
  const emailId = c.req.param('id')
  const email = await inboxService.getEmail(emailId, userId)
  if (!email) {
    return c.json({ error: 'Email not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }
  return c.json({ data: email })
})

// ── Update email (read/starred) ──
inboxRoute.patch(
  '/:id',
  zValidator('json', updateEmailSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const emailId = c.req.param('id')
    const data = c.req.valid('json')
    const email = await inboxService.updateEmail(emailId, userId, data)
    if (!email) {
      return c.json({ error: 'Email not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    }
    return c.json({ data: email })
  },
)

// ── Delete email ──
inboxRoute.delete('/:id', async (c) => {
  const userId = c.get('dbUserId')
  const emailId = c.req.param('id')
  const deleted = await inboxService.deleteEmail(emailId, userId)
  if (!deleted) {
    return c.json({ error: 'Email not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }
  return c.json({ data: { success: true } })
})
