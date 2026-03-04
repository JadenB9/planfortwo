import { z } from 'zod'

export const tableTypeZodEnum = z.enum(['round', 'rectangular', 'banquet', 'head_table', 'sweetheart'])
export const elementTypeZodEnum = z.enum([
  'dance_floor', 'stage', 'bar', 'dj_booth', 'photo_booth',
  'gift_table', 'dessert_table', 'entrance',
])
export const relationshipTypeZodEnum = z.enum(['must_together', 'prefer_together', 'keep_apart'])

export const createSeatingChartSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  eventName: z.string().max(200).nullable().optional(),
})
export type CreateSeatingChartInput = z.infer<typeof createSeatingChartSchema>

export const updateSeatingChartSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  eventName: z.string().max(200).nullable().optional(),
  canvasData: z.record(z.unknown()).nullable().optional(),
  width: z.number().int().min(100).max(5000).optional(),
  height: z.number().int().min(100).max(5000).optional(),
})
export type UpdateSeatingChartInput = z.infer<typeof updateSeatingChartSchema>

export const createSeatingTableSchema = z.object({
  chartId: z.string().uuid(),
  label: z.string().min(1).max(100),
  tableType: tableTypeZodEnum.optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  posX: z.number().int().optional(),
  posY: z.number().int().optional(),
})
export type CreateSeatingTableInput = z.infer<typeof createSeatingTableSchema>

export const updateSeatingTableSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  tableType: tableTypeZodEnum.optional(),
  capacity: z.number().int().min(1).max(50).optional(),
  posX: z.number().int().optional(),
  posY: z.number().int().optional(),
  rotation: z.number().int().min(0).max(360).optional(),
  width: z.number().int().min(20).max(500).optional(),
  height: z.number().int().min(20).max(500).optional(),
})
export type UpdateSeatingTableInput = z.infer<typeof updateSeatingTableSchema>

export const createVenueElementSchema = z.object({
  chartId: z.string().uuid(),
  elementType: elementTypeZodEnum,
  label: z.string().max(100).nullable().optional(),
  posX: z.number().int().optional(),
  posY: z.number().int().optional(),
  width: z.number().int().min(20).max(1000).optional(),
  height: z.number().int().min(20).max(1000).optional(),
})
export type CreateVenueElementInput = z.infer<typeof createVenueElementSchema>

export const assignGuestSchema = z.object({
  tableId: z.string().uuid(),
  guestId: z.string().uuid(),
  seatNumber: z.number().int().min(1).nullable().optional(),
})
export type AssignGuestInput = z.infer<typeof assignGuestSchema>

export const createGuestRelationshipSchema = z.object({
  weddingId: z.string().uuid(),
  guestAId: z.string().uuid(),
  guestBId: z.string().uuid(),
  relationshipType: relationshipTypeZodEnum,
  notes: z.string().max(500).nullable().optional(),
})
export type CreateGuestRelationshipInput = z.infer<typeof createGuestRelationshipSchema>

export const cloneChartSchema = z.object({
  name: z.string().min(1).max(200),
})
export type CloneChartInput = z.infer<typeof cloneChartSchema>
