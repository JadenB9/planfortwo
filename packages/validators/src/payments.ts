import { z } from 'zod'

export const createPurchaseSchema = z.object({
  weddingId: z.string().uuid(),
  amount: z.number().min(0).max(10_000_000),
  currency: z.string().min(2).max(10).default('usd'),
})
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>

export const createReferralSchema = z.object({
  referralCode: z.string().min(4).max(50),
})
export type CreateReferralInput = z.infer<typeof createReferralSchema>

export const redeemReferralSchema = z.object({
  referralCode: z.string().min(4).max(50),
  email: z.string().email(),
})
export type RedeemReferralInput = z.infer<typeof redeemReferralSchema>

export const createContactSubmissionSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})
export type CreateContactSubmissionInput = z.infer<typeof createContactSubmissionSchema>
