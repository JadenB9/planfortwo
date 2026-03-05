import { z } from 'zod'

export const ceremonyMomentZodEnum = z.enum([
  'prelude',
  'processional',
  'welcome',
  'reading',
  'vows',
  'ring_exchange',
  'unity_ceremony',
  'pronouncement',
  'recessional',
  'other',
])

export const createCeremonyOutlineSchema = z.object({
  weddingId: z.string().uuid(),
  moment: ceremonyMomentZodEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  duration: z.number().int().min(1).max(120).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type CreateCeremonyOutlineInput = z.infer<typeof createCeremonyOutlineSchema>

export const updateCeremonyOutlineSchema = z.object({
  moment: ceremonyMomentZodEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  duration: z.number().int().min(1).max(120).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type UpdateCeremonyOutlineInput = z.infer<typeof updateCeremonyOutlineSchema>

export const updateVowSchema = z.object({
  content: z.string().max(10000),
  isRevealed: z.boolean().optional(),
})

export type UpdateVowInput = z.infer<typeof updateVowSchema>

export const createProcessionalEntrySchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  role: z.string().max(100).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type CreateProcessionalEntryInput = z.infer<typeof createProcessionalEntrySchema>

export const updateProcessionalEntrySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().max(100).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type UpdateProcessionalEntryInput = z.infer<typeof updateProcessionalEntrySchema>
