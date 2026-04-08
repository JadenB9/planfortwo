import { z } from 'zod'

// Accepts either YYYY-MM-DD (from <input type="date">) or full ISO 8601
// datetime. The service layer normalizes with new Date(...) before insert.
const eventDateSchema = z
  .string()
  .max(64)
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: 'Must be a valid date (YYYY-MM-DD or ISO 8601 datetime)',
  })

export const createEventSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  date: eventDateSchema.nullable().optional(),
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
  date: eventDateSchema.nullable().optional(),
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

// ── Event Map ──
const hexColorRegex = /^#[0-9a-fA-F]{6}$/

export const mapOverlaySchema = z.object({
  id: z.string().min(1).max(64),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  color: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  text: z.string().max(120),
})
export type MapOverlayInput = z.infer<typeof mapOverlaySchema>

export const mapCenterSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zoom: z.number().min(0).max(22),
})
export type MapCenterInput = z.infer<typeof mapCenterSchema>

const MAX_MAP_IMAGE_BYTES = 4 * 1024 * 1024 // 4 MB after base64 decode

export const setEventMapSchema = z.object({
  imageDataUrl: z
    .string()
    .startsWith('data:image/png;base64,')
    .refine(
      (val) => {
        const base64 = val.slice('data:image/png;base64,'.length)
        // Approximate decoded byte length: base64 chars * 3 / 4
        return (base64.length * 3) / 4 <= MAX_MAP_IMAGE_BYTES
      },
      { message: 'Map image exceeds 4 MB' },
    ),
  overlays: z.array(mapOverlaySchema).max(50),
  center: mapCenterSchema,
  style: z.enum(['street', 'satellite']),
})
export type SetEventMapInput = z.infer<typeof setEventMapSchema>
