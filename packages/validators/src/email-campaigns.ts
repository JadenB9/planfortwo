import { z } from 'zod'

export const emailTemplateTypeZodEnum = z.enum([
  'save_the_date', 'invitation', 'update', 'reminder', 'thank_you', 'custom',
])
export const campaignStatusZodEnum = z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed'])

export const createEmailCampaignSchema = z.object({
  weddingId: z.string().uuid(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50_000),
  templateType: emailTemplateTypeZodEnum.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  recipientFilter: z.record(z.unknown()).nullable().optional(),
})
export type CreateEmailCampaignInput = z.infer<typeof createEmailCampaignSchema>

export const updateEmailCampaignSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(50_000).optional(),
  templateType: emailTemplateTypeZodEnum.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  recipientFilter: z.record(z.unknown()).nullable().optional(),
})
export type UpdateEmailCampaignInput = z.infer<typeof updateEmailCampaignSchema>

export const createAnnouncementSchema = z.object({
  weddingId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  isPublished: z.boolean().optional(),
})
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  isPublished: z.boolean().optional(),
})
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
