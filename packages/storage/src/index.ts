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

function isAllowedUploadSource(sourceUrl: string): boolean {
  const parsed = new URL(sourceUrl)
  const allowedHosts = ['attachments.resend.com', 'resend.dev']
  const isAllowed = allowedHosts.some(
    (h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h),
  )
  if (isAllowed || parsed.hostname.endsWith('.resend.com')) {
    return true
  }
  return false
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

  buildEmailAttachmentKey(emailAddressId: string, attachmentId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '')
    const ext = sanitized.split('.').pop() ?? 'file'
    return `email-attachments/${emailAddressId}/${attachmentId}.${ext}`
  },

  /**
   * Validates that an r2Key belongs to the expected wedding.
   * Each key type uses a known prefix pattern: `{type}/{weddingId}/...`
   * Also rejects path traversal attempts.
   */
  validateKeyOwnership(r2Key: string, weddingId: string): boolean {
    // Reject path traversal
    if (r2Key.includes('..') || r2Key.includes('//')) return false

    const validPrefixes = [
      `gallery/${weddingId}/`,
      `website-photos/${weddingId}/`,
      `receipts/${weddingId}/`,
      `og-images/${weddingId}/`,
    ]

    return validPrefixes.some((prefix) => r2Key.startsWith(prefix))
  },

  /**
   * Validates that an r2Key belongs to the expected email address.
   * Email attachment keys use: `email-attachments/{emailAddressId}/...`
   */
  validateEmailAttachmentKeyOwnership(r2Key: string, emailAddressId: string): boolean {
    if (r2Key.includes('..') || r2Key.includes('//')) return false
    return r2Key.startsWith(`email-attachments/${emailAddressId}/`)
  },

  async uploadFromUrl(key: string, sourceUrl: string, contentType: string): Promise<void> {
    if (!isAllowedUploadSource(sourceUrl)) {
      throw new Error('Upload source URL not from allowed host')
    }

    const response = await fetch(sourceUrl)
    if (!response.ok) throw new Error(`Failed to download: ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )
  },
}
