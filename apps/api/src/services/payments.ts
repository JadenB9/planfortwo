import { eq, and } from 'drizzle-orm'
import Stripe from 'stripe'
import { db, purchases, referrals, contactSubmissions, weddings } from '@planfortwo/db'
import type { CreateContactSubmissionInput } from '@planfortwo/validators'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(key)
}

export const purchaseService = {
  async list(weddingId: string) {
    return db.select().from(purchases).where(eq(purchases.weddingId, weddingId))
  },

  async getById(purchaseId: string, weddingId: string) {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.id, purchaseId), eq(purchases.weddingId, weddingId)))
    return purchase ?? null
  },

  async create(weddingId: string, userId: string, amount: string, currency: string) {
    const [purchase] = await db
      .insert(purchases)
      .values({
        weddingId,
        userId,
        amount,
        currency,
      })
      .returning()
    return purchase!
  },

  async updateStatus(
    purchaseId: string,
    status: 'pending' | 'completed' | 'refunded' | 'failed',
    stripePaymentIntentId?: string,
  ) {
    const updateData: Record<string, unknown> = { status }
    if (stripePaymentIntentId) updateData.stripePaymentIntentId = stripePaymentIntentId
    if (status === 'completed') updateData.completedAt = new Date()

    const [updated] = await db
      .update(purchases)
      .set(updateData)
      .where(eq(purchases.id, purchaseId))
      .returning()
    return updated ?? null
  },

  async createCheckoutSession(weddingId: string, userId: string) {
    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const [purchase] = await db
      .insert(purchases)
      .values({ weddingId, userId, amount: '200.00', currency: 'usd' })
      .returning()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PlanForTwo — Full Access',
              description: 'One-time payment for unlimited wedding planning features.',
            },
            unit_amount: 20000,
          },
          quantity: 1,
        },
      ],
      metadata: { weddingId, userId, purchaseId: purchase!.id },
      success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade?canceled=true`,
    })

    await db
      .update(purchases)
      .set({ stripeSessionId: session.id })
      .where(eq(purchases.id, purchase!.id))

    return { url: session.url }
  },

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const weddingId = session.metadata?.weddingId
    const purchaseId = session.metadata?.purchaseId
    if (!weddingId || !purchaseId) return

    await db
      .update(purchases)
      .set({
        status: 'completed',
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        completedAt: new Date(),
      })
      .where(eq(purchases.id, purchaseId))

    await db.update(weddings).set({ tier: 'full' }).where(eq(weddings.id, weddingId))
  },

  getStripe,
}

export const referralService = {
  async getByCode(code: string) {
    const [ref] = await db.select().from(referrals).where(eq(referrals.referralCode, code))
    return ref ?? null
  },

  async create(userId: string, code: string) {
    const [ref] = await db
      .insert(referrals)
      .values({
        referrerUserId: userId,
        referralCode: code,
      })
      .returning()
    return ref!
  },

  async listByUser(userId: string) {
    return db.select().from(referrals).where(eq(referrals.referrerUserId, userId))
  },

  async redeem(code: string, referredUserId: string, referredEmail: string) {
    const [updated] = await db
      .update(referrals)
      .set({
        referredUserId,
        referredEmail: referredEmail,
        isConverted: true,
        convertedAt: new Date(),
      })
      .where(and(eq(referrals.referralCode, code), eq(referrals.isConverted, false)))
      .returning()
    return updated ?? null
  },
}

export const contactService = {
  async list() {
    return db.select().from(contactSubmissions)
  },

  async create(data: CreateContactSubmissionInput) {
    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      })
      .returning()
    return submission!
  },

  async markRead(submissionId: string) {
    const [updated] = await db
      .update(contactSubmissions)
      .set({ isRead: true })
      .where(eq(contactSubmissions.id, submissionId))
      .returning()
    return updated ?? null
  },
}
