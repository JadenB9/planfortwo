import { eq, and, count } from 'drizzle-orm'
import { db, guestTags, guestTagAssignments, defaultGuestTags } from '@planfortwo/db'
import type { CreateGuestTagInput } from '@planfortwo/validators'

export const guestTagService = {
  async listTags(weddingId: string) {
    const results = await db
      .select()
      .from(guestTags)
      .where(eq(guestTags.weddingId, weddingId))
      .orderBy(guestTags.createdAt)

    return results
  },

  async createTag(input: CreateGuestTagInput) {
    const [tag] = await db
      .insert(guestTags)
      .values({
        weddingId: input.weddingId,
        name: input.name,
        color: input.color,
        isDefault: false,
      })
      .returning()

    return tag!
  },

  async getTag(id: string) {
    const [tag] = await db.select().from(guestTags).where(eq(guestTags.id, id))
    return tag ?? null
  },

  async deleteTag(id: string) {
    await db.delete(guestTags).where(eq(guestTags.id, id))
  },

  async seedDefaultTags(weddingId: string) {
    const [existing] = await db
      .select({ cnt: count() })
      .from(guestTags)
      .where(eq(guestTags.weddingId, weddingId))

    if ((existing?.cnt ?? 0) > 0) return

    for (const tag of defaultGuestTags) {
      await db.insert(guestTags).values({
        weddingId,
        name: tag.name,
        color: tag.color,
        isDefault: true,
      })
    }
  },

  async assignTag(guestId: string, tagId: string) {
    await db.insert(guestTagAssignments).values({ guestId, tagId }).onConflictDoNothing()
  },

  async removeTag(guestId: string, tagId: string) {
    await db
      .delete(guestTagAssignments)
      .where(and(eq(guestTagAssignments.guestId, guestId), eq(guestTagAssignments.tagId, tagId)))
  },
}
