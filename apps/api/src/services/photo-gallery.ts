import { eq, and, asc, desc } from 'drizzle-orm'
import { db, photos } from '@planfortwo/db'
import type { CreatePhotoInput, UpdatePhotoInput } from '@planfortwo/validators'

export const photoGalleryService = {
  async list(weddingId: string, status?: string) {
    const query = db.select().from(photos).where(eq(photos.weddingId, weddingId))
    return query.orderBy(desc(photos.createdAt))
  },

  async getById(photoId: string, weddingId: string) {
    const [photo] = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, photoId), eq(photos.weddingId, weddingId)))
    return photo ?? null
  },

  async create(data: CreatePhotoInput) {
    const [photo] = await db
      .insert(photos)
      .values({
        weddingId: data.weddingId,
        r2Key: data.r2Key,
        url: data.url,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        uploaderName: data.uploaderName,
        uploaderEmail: data.uploaderEmail,
        source: data.source,
        caption: data.caption,
      })
      .returning()
    return photo!
  },

  async update(photoId: string, weddingId: string, data: UpdatePhotoInput) {
    const updateData: Record<string, unknown> = {}
    if (data.moderationStatus !== undefined) updateData.moderationStatus = data.moderationStatus
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite
    if (data.caption !== undefined) updateData.caption = data.caption

    const [updated] = await db
      .update(photos)
      .set(updateData)
      .where(and(eq(photos.id, photoId), eq(photos.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async delete(photoId: string, weddingId: string) {
    const [deleted] = await db
      .delete(photos)
      .where(and(eq(photos.id, photoId), eq(photos.weddingId, weddingId)))
      .returning()
    return deleted ?? null
  },

  async moderate(photoId: string, weddingId: string, status: 'approved' | 'rejected') {
    const [updated] = await db
      .update(photos)
      .set({ moderationStatus: status })
      .where(and(eq(photos.id, photoId), eq(photos.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },
}
