import { z } from 'zod'

export const partyRoleZodEnum = z.enum([
  'maid_of_honor', 'best_man', 'bridesmaid', 'groomsman',
  'flower_girl', 'ring_bearer', 'usher', 'reader',
  'officiant', 'musician', 'mc', 'custom',
])
export const partySideZodEnum = z.enum(['bride', 'groom'])

export const createPartyMemberSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  role: partyRoleZodEnum,
  customRole: z.string().max(100).nullable().optional(),
  side: partySideZodEnum,
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
})
export type CreatePartyMemberInput = z.infer<typeof createPartyMemberSchema>

export const updatePartyMemberSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: partyRoleZodEnum.optional(),
  customRole: z.string().max(100).nullable().optional(),
  side: partySideZodEnum.optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  outfitDetails: z.record(z.unknown()).nullable().optional(),
})
export type UpdatePartyMemberInput = z.infer<typeof updatePartyMemberSchema>

export const createPartyTaskSchema = z.object({
  memberId: z.string().uuid(),
  weddingId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
})
export type CreatePartyTaskInput = z.infer<typeof createPartyTaskSchema>

export const updatePartyTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  isCompleted: z.boolean().optional(),
})
export type UpdatePartyTaskInput = z.infer<typeof updatePartyTaskSchema>

export const createPartyGiftSchema = z.object({
  memberId: z.string().uuid(),
  weddingId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  budget: z.number().int().min(0).max(100_000).nullable().optional(),
})
export type CreatePartyGiftInput = z.infer<typeof createPartyGiftSchema>
