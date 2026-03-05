import { eq, and, desc } from 'drizzle-orm'
import { db, guestbookEntries } from '@planfortwo/db'
import type { CreateGuestbookEntryInput } from '@planfortwo/validators'

export const guestbookService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(guestbookEntries)
      .where(eq(guestbookEntries.weddingId, weddingId))
      .orderBy(desc(guestbookEntries.createdAt))
  },

  async listApproved(weddingId: string) {
    return db
      .select()
      .from(guestbookEntries)
      .where(
        and(
          eq(guestbookEntries.weddingId, weddingId),
          eq(guestbookEntries.isApproved, true),
          eq(guestbookEntries.isVisible, true),
        ),
      )
      .orderBy(desc(guestbookEntries.createdAt))
  },

  async create(data: CreateGuestbookEntryInput) {
    const [entry] = await db
      .insert(guestbookEntries)
      .values({
        weddingId: data.weddingId,
        authorName: data.authorName,
        message: data.message,
      })
      .returning()

    return entry!
  },

  async approve(id: string, weddingId: string, approved: boolean) {
    const [updated] = await db
      .update(guestbookEntries)
      .set({ isApproved: approved })
      .where(and(eq(guestbookEntries.id, id), eq(guestbookEntries.weddingId, weddingId)))
      .returning()

    return updated ?? null
  },

  async delete(id: string, weddingId: string) {
    const [entry] = await db
      .select({ id: guestbookEntries.id })
      .from(guestbookEntries)
      .where(and(eq(guestbookEntries.id, id), eq(guestbookEntries.weddingId, weddingId)))

    if (!entry) throw new Error('Guestbook entry not found')

    await db
      .delete(guestbookEntries)
      .where(and(eq(guestbookEntries.id, id), eq(guestbookEntries.weddingId, weddingId)))
  },
}
