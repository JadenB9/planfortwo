import { eq, and, asc } from 'drizzle-orm'
import { db, websitePhotos } from '@planfortwo/db'
import { storageClient } from '@planfortwo/storage'
import type { RegisterPhotoInput } from '@planfortwo/validators'

export const websitePhotoService = {
  async list(weddingId: string, sectionId?: string) {
    const conditions = [eq(websitePhotos.weddingId, weddingId)]
    if (sectionId) conditions.push(eq(websitePhotos.sectionId, sectionId))

    return db
      .select()
      .from(websitePhotos)
      .where(and(...conditions))
      .orderBy(asc(websitePhotos.sortOrder))
  },

  async getUploadUrl(weddingId: string, fileName: string, mimeType: string) {
    const photoId = crypto.randomUUID()
    const r2Key = storageClient.buildWebsitePhotoKey(weddingId, photoId, fileName)
    const uploadUrl = await storageClient.getUploadUrl(r2Key, mimeType)
    const publicUrl = await storageClient.getDownloadUrl(r2Key)

    return { uploadUrl, r2Key, url: publicUrl, photoId }
  },

  async register(data: RegisterPhotoInput) {
    const [photo] = await db
      .insert(websitePhotos)
      .values({
        weddingId: data.weddingId,
        sectionId: data.sectionId ?? null,
        r2Key: data.r2Key,
        url: data.url,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width ?? null,
        height: data.height ?? null,
        altText: data.altText ?? null,
      })
      .returning()

    return photo!
  },

  async delete(id: string, weddingId: string) {
    const [photo] = await db
      .select()
      .from(websitePhotos)
      .where(and(eq(websitePhotos.id, id), eq(websitePhotos.weddingId, weddingId)))

    if (!photo) throw new Error('Photo not found')

    await storageClient.deleteObject(photo.r2Key)
    await db
      .delete(websitePhotos)
      .where(and(eq(websitePhotos.id, id), eq(websitePhotos.weddingId, weddingId)))
  },

  async reorder(weddingId: string, items: { id: string; sortOrder: number }[]) {
    for (const item of items) {
      await db
        .update(websitePhotos)
        .set({ sortOrder: item.sortOrder })
        .where(and(eq(websitePhotos.id, item.id), eq(websitePhotos.weddingId, weddingId)))
    }
  },
}
