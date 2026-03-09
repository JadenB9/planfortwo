import { z } from 'zod'

export const photoSourceZodEnum = z.enum(['guest', 'professional', 'couple'])
export const photoModerationZodEnum = z.enum(['pending', 'approved', 'rejected'])

export const createPhotoSchema = z.object({
  weddingId: z.string().uuid(),
  r2Key: z.string().min(1),
  url: z.string().url(),
  fileName: z.string().min(1).max(255),
  mimeType: z
    .string()
    .regex(
      /^image\/(jpeg|png|gif|webp|heic|heif|avif|bmp|tiff)$/,
      'Must be a valid image type (JPEG, PNG, GIF, WebP, HEIC, HEIF, AVIF, BMP, TIFF)',
    ),
  fileSize: z.number().int().min(1).max(20_000_000),
  width: z.number().int().min(1).nullable().optional(),
  height: z.number().int().min(1).nullable().optional(),
  uploaderName: z.string().max(200).nullable().optional(),
  uploaderEmail: z.string().email().nullable().optional(),
  source: photoSourceZodEnum.optional(),
  caption: z.string().max(500).nullable().optional(),
})
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>

export const updatePhotoSchema = z.object({
  moderationStatus: photoModerationZodEnum.optional(),
  isFavorite: z.boolean().optional(),
  caption: z.string().max(500).nullable().optional(),
})
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>

export const moderatePhotoSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})
export type ModeratePhotoInput = z.infer<typeof moderatePhotoSchema>

export const requestGalleryUploadSchema = z.object({
  weddingId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z
    .string()
    .regex(
      /^image\/(jpeg|png|gif|webp|heic|heif|avif|bmp|tiff)$/,
      'Must be a valid image type (JPEG, PNG, GIF, WebP, HEIC, HEIF, AVIF, BMP, TIFF)',
    ),
  fileSize: z.number().int().min(1).max(20_000_000),
})
export type RequestGalleryUploadInput = z.infer<typeof requestGalleryUploadSchema>
