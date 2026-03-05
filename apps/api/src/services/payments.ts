import { eq, and } from 'drizzle-orm'
import { db, purchases, referrals, contactSubmissions } from '@planfortwo/db'
import type { CreateContactSubmissionInput } from '@planfortwo/validators'

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
