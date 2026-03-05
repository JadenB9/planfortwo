import { z } from 'zod'

export const emailLocalPartSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(
    /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/,
    'Lowercase alphanumeric, dots, and hyphens only. Cannot start or end with a dot or hyphen.',
  )

export const claimAddressSchema = z.object({
  address: emailLocalPartSchema,
  displayName: z.string().min(1).max(100),
})

export type ClaimAddressInput = z.infer<typeof claimAddressSchema>

export const composeEmailSchema = z.object({
  emailAddressId: z.string().uuid(),
  toAddress: z.string().email(),
  subject: z.string().min(1).max(500),
  textBody: z.string().min(1).max(50_000),
  htmlBody: z.string().max(200_000).optional(),
})

export type ComposeEmailInput = z.infer<typeof composeEmailSchema>

export const updateEmailSchema = z.object({
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
})

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>

export const inboxFiltersSchema = z.object({
  emailAddressId: z.string().uuid().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  isRead: z.coerce.boolean().optional(),
  isStarred: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type InboxFiltersInput = z.infer<typeof inboxFiltersSchema>
