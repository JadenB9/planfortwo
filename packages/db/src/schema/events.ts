import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { MapCenter, MapOverlay } from '@planfortwo/types'
import { weddings } from './weddings'

// Re-exports for historical consumers — the canonical types live in
// @planfortwo/types. The jsonb column accepts a discriminated union of
// box + line overlays (see packages/types/src/index.ts).
export type EventMapOverlay = MapOverlay
export type EventMapCenter = MapCenter

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }),
  startTime: text('start_time'),
  endTime: text('end_time'),
  venue: text('venue'),
  address: text('address'),
  dressCode: text('dress_code'),
  mapImageUrl: text('map_image_url'),
  mapImageKey: text('map_image_key'),
  mapOverlays: jsonb('map_overlays').$type<EventMapOverlay[]>(),
  mapCenter: jsonb('map_center').$type<EventMapCenter>(),
  mapStyle: text('map_style'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const timelineEntries = pgTable('timeline_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  time: text('time').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  responsiblePerson: text('responsible_person'),
  location: text('location'),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EventRecord = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type TimelineEntryRecord = typeof timelineEntries.$inferSelect
export type NewTimelineEntry = typeof timelineEntries.$inferInsert
