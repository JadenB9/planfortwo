import { z } from 'zod'

export const createEventSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  date: z.string().datetime().nullable().optional(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  dressCode: z.string().max(200).nullable().optional(),
})
export type CreateEventInput = z.infer<typeof createEventSchema>

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  date: z.string().datetime().nullable().optional(),
  startTime: z.string().max(10).nullable().optional(),
  endTime: z.string().max(10).nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  dressCode: z.string().max(200).nullable().optional(),
})
export type UpdateEventInput = z.infer<typeof updateEventSchema>

export const createTimelineEntrySchema = z.object({
  eventId: z.string().uuid(),
  weddingId: z.string().uuid(),
  time: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  responsiblePerson: z.string().max(200).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})
export type CreateTimelineEntryInput = z.infer<typeof createTimelineEntrySchema>

export const updateTimelineEntrySchema = z.object({
  time: z.string().min(1).max(20).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  responsiblePerson: z.string().max(200).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})
export type UpdateTimelineEntryInput = z.infer<typeof updateTimelineEntrySchema>
