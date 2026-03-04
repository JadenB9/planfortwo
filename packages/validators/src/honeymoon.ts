import { z } from 'zod'

export const createHoneymoonPlanSchema = z.object({
  weddingId: z.string().uuid(),
  destination: z.string().min(1).max(300),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  budget: z.number().int().min(0).max(10_000_000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export type CreateHoneymoonPlanInput = z.infer<typeof createHoneymoonPlanSchema>

export const updateHoneymoonPlanSchema = z.object({
  destination: z.string().min(1).max(300).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  budget: z.number().int().min(0).max(10_000_000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  packingList: z.array(z.string().max(200)).max(200).optional(),
})

export type UpdateHoneymoonPlanInput = z.infer<typeof updateHoneymoonPlanSchema>

export const createHoneymoonActivitySchema = z.object({
  planId: z.string().uuid(),
  dayNumber: z.number().int().min(1).max(365),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  cost: z.number().int().min(0).max(10_000_000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type CreateHoneymoonActivityInput = z.infer<typeof createHoneymoonActivitySchema>

export const updateHoneymoonActivitySchema = z.object({
  dayNumber: z.number().int().min(1).max(365).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(300).nullable().optional(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  cost: z.number().int().min(0).max(10_000_000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type UpdateHoneymoonActivityInput = z.infer<typeof updateHoneymoonActivitySchema>
