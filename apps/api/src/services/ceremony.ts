import { eq, and, asc } from 'drizzle-orm'
import { db, ceremonyOutlines, vowWorkspaces, processionalEntries } from '@planfortwo/db'
import type {
  CreateCeremonyOutlineInput,
  UpdateCeremonyOutlineInput,
  UpdateVowInput,
  CreateProcessionalEntryInput,
  UpdateProcessionalEntryInput,
} from '@planfortwo/validators'

export const ceremonyService = {
  async listOutlines(weddingId: string) {
    return db
      .select()
      .from(ceremonyOutlines)
      .where(eq(ceremonyOutlines.weddingId, weddingId))
      .orderBy(asc(ceremonyOutlines.sortOrder))
  },

  async createOutline(data: CreateCeremonyOutlineInput) {
    const [outline] = await db.insert(ceremonyOutlines).values(data).returning()
    return outline
  },

  async updateOutline(id: string, weddingId: string, data: UpdateCeremonyOutlineInput) {
    const [updated] = await db
      .update(ceremonyOutlines)
      .set(data)
      .where(and(eq(ceremonyOutlines.id, id), eq(ceremonyOutlines.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async deleteOutline(id: string, weddingId: string) {
    const [deleted] = await db
      .delete(ceremonyOutlines)
      .where(and(eq(ceremonyOutlines.id, id), eq(ceremonyOutlines.weddingId, weddingId)))
      .returning()
    return deleted ?? null
  },

  async getVow(weddingId: string, userId: string) {
    const [vow] = await db
      .select()
      .from(vowWorkspaces)
      .where(and(eq(vowWorkspaces.weddingId, weddingId), eq(vowWorkspaces.userId, userId)))
    return vow ?? null
  },

  async upsertVow(weddingId: string, userId: string, data: UpdateVowInput) {
    const existing = await this.getVow(weddingId, userId)
    if (existing) {
      const [updated] = await db
        .update(vowWorkspaces)
        .set(data)
        .where(and(eq(vowWorkspaces.weddingId, weddingId), eq(vowWorkspaces.userId, userId)))
        .returning()
      return updated
    }
    const [created] = await db
      .insert(vowWorkspaces)
      .values({ weddingId, userId, content: data.content, isRevealed: data.isRevealed ?? false })
      .returning()
    return created
  },

  async listProcessional(weddingId: string) {
    return db
      .select()
      .from(processionalEntries)
      .where(eq(processionalEntries.weddingId, weddingId))
      .orderBy(asc(processionalEntries.sortOrder))
  },

  async createProcessionalEntry(data: CreateProcessionalEntryInput) {
    const [entry] = await db.insert(processionalEntries).values(data).returning()
    return entry
  },

  async updateProcessionalEntry(id: string, weddingId: string, data: UpdateProcessionalEntryInput) {
    const [updated] = await db
      .update(processionalEntries)
      .set(data)
      .where(and(eq(processionalEntries.id, id), eq(processionalEntries.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async deleteProcessionalEntry(id: string, weddingId: string) {
    const [deleted] = await db
      .delete(processionalEntries)
      .where(and(eq(processionalEntries.id, id), eq(processionalEntries.weddingId, weddingId)))
      .returning()
    return deleted ?? null
  },
}
