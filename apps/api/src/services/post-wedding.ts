import { eq, and, asc } from 'drizzle-orm'
import { db, thankYouNotes, nameChangeTasks, vendorReviews, notificationPreferences } from '@planfortwo/db'
import type { CreateThankYouNoteInput, UpdateThankYouNoteInput, CreateVendorReviewInput, UpdateNotificationPreferencesInput } from '@planfortwo/validators'

export const thankYouService = {
  async list(weddingId: string) {
    return db.select().from(thankYouNotes).where(eq(thankYouNotes.weddingId, weddingId)).orderBy(asc(thankYouNotes.createdAt))
  },

  async getById(noteId: string, weddingId: string) {
    const [note] = await db.select().from(thankYouNotes).where(and(eq(thankYouNotes.id, noteId), eq(thankYouNotes.weddingId, weddingId)))
    return note ?? null
  },

  async create(data: CreateThankYouNoteInput) {
    const [note] = await db.insert(thankYouNotes).values({
      weddingId: data.weddingId,
      guestId: data.guestId ?? undefined,
      giftId: data.giftId ?? undefined,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail ?? undefined,
      recipientAddress: data.recipientAddress ?? undefined,
      message: data.message ?? undefined,
    }).returning()
    return note!
  },

  async update(noteId: string, weddingId: string, data: UpdateThankYouNoteInput) {
    const updateData: Record<string, unknown> = {}
    if (data.message !== undefined) updateData.message = data.message
    if (data.status !== undefined) {
      updateData.status = data.status
      if (data.status === 'sent') updateData.sentAt = new Date()
    }

    const [updated] = await db.update(thankYouNotes).set(updateData).where(and(eq(thankYouNotes.id, noteId), eq(thankYouNotes.weddingId, weddingId))).returning()
    return updated ?? null
  },

  async delete(noteId: string, weddingId: string) {
    const [deleted] = await db.delete(thankYouNotes).where(and(eq(thankYouNotes.id, noteId), eq(thankYouNotes.weddingId, weddingId))).returning()
    return !!deleted
  },
}

export const nameChangeService = {
  async list(weddingId: string) {
    return db.select().from(nameChangeTasks).where(eq(nameChangeTasks.weddingId, weddingId)).orderBy(asc(nameChangeTasks.sortOrder))
  },

  async create(weddingId: string, institution: string, description?: string, documentsRequired?: string) {
    const [task] = await db.insert(nameChangeTasks).values({
      weddingId,
      institution,
      description: description ?? undefined,
      documentsRequired: documentsRequired ?? undefined,
    }).returning()
    return task!
  },

  async toggleComplete(taskId: string, weddingId: string) {
    const [existing] = await db.select().from(nameChangeTasks).where(and(eq(nameChangeTasks.id, taskId), eq(nameChangeTasks.weddingId, weddingId)))
    if (!existing) return null

    const [updated] = await db.update(nameChangeTasks).set({
      isCompleted: !existing.isCompleted,
      completedAt: existing.isCompleted ? null : new Date(),
    }).where(eq(nameChangeTasks.id, taskId)).returning()
    return updated ?? null
  },

  async delete(taskId: string, weddingId: string) {
    const [deleted] = await db.delete(nameChangeTasks).where(and(eq(nameChangeTasks.id, taskId), eq(nameChangeTasks.weddingId, weddingId))).returning()
    return !!deleted
  },
}

export const vendorReviewService = {
  async list(weddingId: string) {
    return db.select().from(vendorReviews).where(eq(vendorReviews.weddingId, weddingId)).orderBy(asc(vendorReviews.createdAt))
  },

  async create(data: CreateVendorReviewInput) {
    const [review] = await db.insert(vendorReviews).values({
      weddingId: data.weddingId,
      vendorId: data.vendorId,
      rating: data.rating,
      reviewText: data.reviewText ?? undefined,
    }).returning()
    return review!
  },

  async delete(reviewId: string, weddingId: string) {
    const [deleted] = await db.delete(vendorReviews).where(and(eq(vendorReviews.id, reviewId), eq(vendorReviews.weddingId, weddingId))).returning()
    return !!deleted
  },
}

export const notificationPrefService = {
  async get(userId: string, weddingId: string) {
    const [prefs] = await db.select().from(notificationPreferences).where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.weddingId, weddingId)))
    return prefs ?? null
  },

  async upsert(userId: string, weddingId: string, data: UpdateNotificationPreferencesInput) {
    const existing = await this.get(userId, weddingId)
    if (existing) {
      const updateData: Record<string, unknown> = {}
      if (data.emailRsvp !== undefined) updateData.emailRsvp = data.emailRsvp
      if (data.emailPaymentReminder !== undefined) updateData.emailPaymentReminder = data.emailPaymentReminder
      if (data.emailTaskDue !== undefined) updateData.emailTaskDue = data.emailTaskDue
      if (data.emailWeeklySummary !== undefined) updateData.emailWeeklySummary = data.emailWeeklySummary
      if (data.digestFrequency !== undefined) updateData.digestFrequency = data.digestFrequency

      const [updated] = await db.update(notificationPreferences).set(updateData).where(eq(notificationPreferences.id, existing.id)).returning()
      return updated!
    }

    const [created] = await db.insert(notificationPreferences).values({
      userId,
      weddingId,
      emailRsvp: data.emailRsvp,
      emailPaymentReminder: data.emailPaymentReminder,
      emailTaskDue: data.emailTaskDue,
      emailWeeklySummary: data.emailWeeklySummary,
      digestFrequency: data.digestFrequency,
    }).returning()
    return created!
  },
}
