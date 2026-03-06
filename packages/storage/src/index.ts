import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  if (!accountId) throw new Error('R2_ACCOUNT_ID is required')

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  })
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME ?? 'planfortwo-uploads'
}

export const storageClient = {
  async getUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: contentType,
    })
    return getSignedUrl(client, command, { expiresIn })
  },

  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const publicUrl = process.env.R2_PUBLIC_URL
    if (publicUrl) {
      return `${publicUrl}/${key}`
    }

    const client = getR2Client()
    const command = new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
    return getSignedUrl(client, command, { expiresIn })
  },

  async deleteObject(key: string): Promise<void> {
    const client = getR2Client()
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    )
  },

  buildReceiptKey(weddingId: string, itemId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '')
    const ext = sanitized.split('.').pop() ?? 'file'
    return `receipts/${weddingId}/${itemId}.${ext}`
  },

  buildWebsitePhotoKey(weddingId: string, photoId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '')
    const ext = sanitized.split('.').pop() ?? 'file'
    return `website-photos/${weddingId}/${photoId}.${ext}`
  },

  buildOgImageKey(weddingId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '')
    const ext = sanitized.split('.').pop() ?? 'file'
    return `og-images/${weddingId}/${Date.now()}.${ext}`
  },

  buildGalleryPhotoKey(weddingId: string, photoId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '')
    const ext = sanitized.split('.').pop() ?? 'file'
    return `gallery/${weddingId}/${photoId}.${ext}`
  },
}
