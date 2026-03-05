import { z } from 'zod'

export const thankYouStatusZodEnum = z.enum(['not_started', 'drafted', 'sent'])

export const createThankYouNoteSchema = z.object({
  weddingId: z.string().uuid(),
  guestId: z.string().uuid().nullable().optional(),
  giftId: z.string().uuid().nullable().optional(),
  recipientName: z.string().min(1).max(200),
  recipientEmail: z.string().email().nullable().optional(),
  recipientAddress: z.string().max(500).nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
})
export type CreateThankYouNoteInput = z.infer<typeof createThankYouNoteSchema>

export const updateThankYouNoteSchema = z.object({
  message: z.string().max(5000).nullable().optional(),
  status: thankYouStatusZodEnum.optional(),
})
export type UpdateThankYouNoteInput = z.infer<typeof updateThankYouNoteSchema>

export const createVendorReviewSchema = z.object({
  weddingId: z.string().uuid(),
  vendorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(5000).nullable().optional(),
})
export type CreateVendorReviewInput = z.infer<typeof createVendorReviewSchema>

export const updateNotificationPreferencesSchema = z.object({
  emailRsvp: z.boolean().optional(),
  emailPaymentReminder: z.boolean().optional(),
  emailTaskDue: z.boolean().optional(),
  emailWeeklySummary: z.boolean().optional(),
  digestFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
})
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>

export const createNameChangeTaskSchema = z.object({
  institution: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  documentsRequired: z.string().max(2000).nullable().optional(),
})
export type CreateNameChangeTaskInput = z.infer<typeof createNameChangeTaskSchema>
