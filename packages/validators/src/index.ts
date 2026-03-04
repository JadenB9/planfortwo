import { z } from 'zod'

// ── Auth ──
export const createUserSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ── Wedding ──
export const weddingStyleEnum = z.enum([
  'classic',
  'modern',
  'rustic',
  'romantic',
  'minimalist',
  'bohemian',
  'garden',
  'beach',
  'elegant',
  'whimsical',
])

export const timelineTemplateEnum = z.enum(['6-month', '12-month', '18-month', 'elopement'])

export const createWeddingSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().datetime().nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).default('US'),
  guestCountEstimate: z.number().int().min(1).max(2000).nullable().optional(),
  budgetTotal: z.number().min(0).max(10_000_000).nullable().optional(),
  style: weddingStyleEnum.nullable().optional(),
  timelineTemplate: timelineTemplateEnum.default('12-month'),
})

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>

// ── Onboarding ──
export const onboardingSchema = z.object({
  partnerFirstName: z.string().min(1).max(100),
  partnerLastName: z.string().min(1).max(100),
  weddingDate: z.string().datetime().nullable().optional(),
  guestCountEstimate: z.number().int().min(1).max(2000).nullable().optional(),
  budgetTotal: z.number().min(0).max(10_000_000).nullable().optional(),
  style: weddingStyleEnum.nullable().optional(),
  timelineTemplate: timelineTemplateEnum.default('12-month'),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

// ── Partner Invite ──
export const invitePartnerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100).optional(),
})

export type InvitePartnerInput = z.infer<typeof invitePartnerSchema>

// ── Pagination ──
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// ── Common ──
export const idParamSchema = z.object({
  id: z.string().uuid(),
})
