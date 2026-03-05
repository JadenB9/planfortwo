import { eq, and, asc } from 'drizzle-orm'
import { db, websiteSections } from '@planfortwo/db'
import type { UpdateWebsiteSectionInput } from '@planfortwo/validators'
import { activityService } from './activity.js'

export const websiteSectionService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(websiteSections)
      .where(eq(websiteSections.weddingId, weddingId))
      .orderBy(asc(websiteSections.sortOrder))
  },

  async get(id: string, weddingId: string) {
    const [section] = await db
      .select()
      .from(websiteSections)
      .where(and(eq(websiteSections.id, id), eq(websiteSections.weddingId, weddingId)))

    return section ?? null
  },

  async update(id: string, weddingId: string, data: UpdateWebsiteSectionInput, userId: string) {
    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible

    if (Object.keys(updateData).length === 0) return null

    const [updated] = await db
      .update(websiteSections)
      .set(updateData)
      .where(and(eq(websiteSections.id, id), eq(websiteSections.weddingId, weddingId)))
      .returning()

    if (updated) {
      await activityService.log({
        weddingId,
        userId,
        action: 'website_section_updated',
        entityType: 'website_section',
        entityId: id,
        metadata: { sectionType: updated.sectionType, title: updated.title },
      })
    }

    return updated ?? null
  },

  async reorder(weddingId: string, items: { id: string; sortOrder: number }[]) {
    for (const item of items) {
      await db
        .update(websiteSections)
        .set({ sortOrder: item.sortOrder })
        .where(and(eq(websiteSections.id, item.id), eq(websiteSections.weddingId, weddingId)))
    }
  },

  async createCustom(
    weddingId: string,
    title: string,
    content: Record<string, unknown> | undefined,
    userId: string,
  ) {
    const sections = await this.list(weddingId)
    const maxOrder = sections.reduce((max, s) => Math.max(max, s.sortOrder), -1)

    const [section] = await db
      .insert(websiteSections)
      .values({
        weddingId,
        sectionType: 'custom',
        title,
        content: content ?? { body: '' },
        sortOrder: maxOrder + 1,
      })
      .returning()

    if (section) {
      await activityService.log({
        weddingId,
        userId,
        action: 'website_section_updated',
        entityType: 'website_section',
        entityId: section.id,
        metadata: { title, action: 'created' },
      })
    }

    return section!
  },

  async deleteCustom(id: string, weddingId: string) {
    const [section] = await db
      .select()
      .from(websiteSections)
      .where(and(eq(websiteSections.id, id), eq(websiteSections.weddingId, weddingId)))

    if (!section) throw new Error('Section not found')
    if (section.sectionType !== 'custom') throw new Error('Only custom sections can be deleted')

    await db
      .delete(websiteSections)
      .where(and(eq(websiteSections.id, id), eq(websiteSections.weddingId, weddingId)))
  },
}
