import { eq, and, desc, sql } from 'drizzle-orm'
import { db, prayers } from '@planfortwo/db'
import type { CreatePrayerInput } from '@planfortwo/validators'

export const prayersService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(prayers)
      .where(eq(prayers.weddingId, weddingId))
      .orderBy(desc(prayers.createdAt))
  },

  async listApproved(weddingId: string) {
    return db
      .select()
      .from(prayers)
      .where(
        and(
          eq(prayers.weddingId, weddingId),
          eq(prayers.isApproved, true),
          eq(prayers.isVisible, true),
        ),
      )
      .orderBy(desc(prayers.createdAt))
  },

  async create(data: CreatePrayerInput) {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prayers)
      .where(eq(prayers.weddingId, data.weddingId))
    if ((rows[0]?.count ?? 0) >= 5000) {
      throw new Error('Prayers have reached maximum capacity')
    }

    const [entry] = await db
      .insert(prayers)
      .values({
        weddingId: data.weddingId,
        authorName: data.authorName,
        prayerText: data.prayerText,
      })
      .returning()

    return entry!
  },

  async approve(id: string, weddingId: string, approved: boolean) {
    const [updated] = await db
      .update(prayers)
      .set({ isApproved: approved })
      .where(and(eq(prayers.id, id), eq(prayers.weddingId, weddingId)))
      .returning()

    return updated ?? null
  },

  async delete(id: string, weddingId: string) {
    const [entry] = await db
      .select({ id: prayers.id })
      .from(prayers)
      .where(and(eq(prayers.id, id), eq(prayers.weddingId, weddingId)))

    if (!entry) throw new Error('Prayer not found')

    await db.delete(prayers).where(and(eq(prayers.id, id), eq(prayers.weddingId, weddingId)))
  },
}
