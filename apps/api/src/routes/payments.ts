import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createContactSubmissionSchema,
  createReferralSchema,
  redeemReferralSchema,
  redeemPromoSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { rateLimit } from '../middleware/rate-limit.js'
import { purchaseService, referralService, contactService } from '../services/payments.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const purchasesRoute = new Hono<Env>()
export const referralsRoute = new Hono<Env>()
export const contactRoute = new Hono()

// ── Purchases ──
purchasesRoute.use('*', authMiddleware, resolveUserMiddleware)

purchasesRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const purchases = await purchaseService.list(weddingId)
  return c.json({ data: purchases })
})

purchasesRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const purchaseId = c.req.param('id')
  const weddingId = c.get('weddingId')
  const purchase = await purchaseService.getById(purchaseId, weddingId)
  if (!purchase)
    return c.json({ error: 'Purchase not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: purchase })
})

purchasesRoute.post('/checkout', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const userId = c.get('dbUserId')
  try {
    const result = await purchaseService.createCheckoutSession(weddingId, userId)
    return c.json({ data: result })
  } catch (err) {
    console.error('Checkout session creation failed:', err)
    return c.json(
      { error: 'Failed to create checkout session', code: 'CHECKOUT_ERROR', statusCode: 500 },
      500,
    )
  }
})

const promoRateLimit = rateLimit({ windowMs: 3_600_000, max: 5 })

purchasesRoute.post(
  '/redeem-promo',
  promoRateLimit,
  resolveWeddingMiddleware,
  zValidator('json', redeemPromoSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const { weddingId, promoCode } = c.req.valid('json')
    const result = await purchaseService.redeemPromoCode(weddingId, userId, promoCode)
    if (!result.success) {
      return c.json({ error: result.error, code: 'INVALID_PROMO', statusCode: 400 }, 400)
    }
    return c.json({ data: { success: true } })
  },
)

// ── Referrals ──
referralsRoute.use('*', authMiddleware, resolveUserMiddleware)

referralsRoute.get('/', async (c) => {
  const userId = c.get('dbUserId')
  const refs = await referralService.listByUser(userId)
  return c.json({ data: refs })
})

referralsRoute.post(
  '/',
  zValidator('json', createReferralSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const data = c.req.valid('json')
    const ref = await referralService.create(userId, data.referralCode)
    return c.json({ data: ref }, 201)
  },
)

referralsRoute.post(
  '/redeem',
  zValidator('json', redeemReferralSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const data = c.req.valid('json')
    const redeemed = await referralService.redeem(data.referralCode, userId, data.email)
    if (!redeemed)
      return c.json(
        {
          error: 'Invalid or already used referral code',
          code: 'INVALID_REFERRAL',
          statusCode: 400,
        },
        400,
      )
    return c.json({ data: redeemed })
  },
)

// ── Contact Form (public, no auth) ──
contactRoute.post(
  '/',
  zValidator('json', createContactSubmissionSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const submission = await contactService.create(data)
    return c.json({ data: { success: true, id: submission.id } }, 201)
  },
)
