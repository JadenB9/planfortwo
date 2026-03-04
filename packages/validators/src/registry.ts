import { z } from 'zod'

export const createRegistryLinkSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  logoUrl: z.string().url().nullable().optional(),
})
export type CreateRegistryLinkInput = z.infer<typeof createRegistryLinkSchema>

export const createCashFundSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  goalAmount: z.number().min(0).max(1_000_000).optional(),
})
export type CreateCashFundInput = z.infer<typeof createCashFundSchema>

export const updateCashFundSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  goalAmount: z.number().min(0).max(1_000_000).optional(),
})
export type UpdateCashFundInput = z.infer<typeof updateCashFundSchema>

export const createCashFundContributionSchema = z.object({
  fundId: z.string().uuid(),
  guestName: z.string().min(1).max(200),
  guestEmail: z.string().email().nullable().optional(),
  amount: z.number().min(1).max(100_000),
  message: z.string().max(1000).nullable().optional(),
  stripePaymentId: z.string().nullable().optional(),
})
export type CreateCashFundContributionInput = z.infer<typeof createCashFundContributionSchema>

export const createGiftSchema = z.object({
  weddingId: z.string().uuid(),
  guestId: z.string().uuid().nullable().optional(),
  description: z.string().min(1).max(500),
  amount: z.number().min(0).max(1_000_000).nullable().optional(),
  isFromRegistry: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
})
export type CreateGiftInput = z.infer<typeof createGiftSchema>

export const updateGiftSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  thankYouSent: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
})
export type UpdateGiftInput = z.infer<typeof updateGiftSchema>

export const createMoodBoardSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
})
export type CreateMoodBoardInput = z.infer<typeof createMoodBoardSchema>

export const createMoodBoardItemSchema = z.object({
  boardId: z.string().uuid(),
  imageUrl: z.string().url(),
  r2Key: z.string().nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
})
export type CreateMoodBoardItemInput = z.infer<typeof createMoodBoardItemSchema>
