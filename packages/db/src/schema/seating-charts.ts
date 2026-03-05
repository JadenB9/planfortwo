import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const tableTypeEnum = pgEnum('table_type', [
  'round',
  'rectangular',
  'banquet',
  'head_table',
  'sweetheart',
])

export const elementTypeEnum = pgEnum('element_type', [
  'dance_floor',
  'stage',
  'bar',
  'dj_booth',
  'photo_booth',
  'gift_table',
  'dessert_table',
  'entrance',
])

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'must_together',
  'prefer_together',
  'keep_apart',
])

export const seatingCharts = pgTable('seating_charts', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  eventName: text('event_name'),
  floorPlanUrl: text('floor_plan_url'),
  canvasData: jsonb('canvas_data').$type<Record<string, unknown>>(),
  width: integer('width').notNull().default(1200),
  height: integer('height').notNull().default(800),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const seatingTables = pgTable('seating_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id')
    .notNull()
    .references(() => seatingCharts.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  tableType: tableTypeEnum('table_type').notNull().default('round'),
  capacity: integer('capacity').notNull().default(8),
  posX: integer('pos_x').notNull().default(0),
  posY: integer('pos_y').notNull().default(0),
  rotation: integer('rotation').notNull().default(0),
  width: integer('width').notNull().default(100),
  height: integer('height').notNull().default(100),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const venueElements = pgTable('venue_elements', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id')
    .notNull()
    .references(() => seatingCharts.id, { onDelete: 'cascade' }),
  elementType: elementTypeEnum('element_type').notNull(),
  label: text('label'),
  posX: integer('pos_x').notNull().default(0),
  posY: integer('pos_y').notNull().default(0),
  width: integer('width').notNull().default(100),
  height: integer('height').notNull().default(100),
  rotation: integer('rotation').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tableAssignments = pgTable('table_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id')
    .notNull()
    .references(() => seatingTables.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id').notNull(),
  seatNumber: integer('seat_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const guestRelationships = pgTable('guest_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  guestAId: uuid('guest_a_id').notNull(),
  guestBId: uuid('guest_b_id').notNull(),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type SeatingChartRecord = typeof seatingCharts.$inferSelect
export type NewSeatingChart = typeof seatingCharts.$inferInsert
export type SeatingTableRecord = typeof seatingTables.$inferSelect
export type NewSeatingTable = typeof seatingTables.$inferInsert
export type VenueElementRecord = typeof venueElements.$inferSelect
export type NewVenueElement = typeof venueElements.$inferInsert
export type TableAssignmentRecord = typeof tableAssignments.$inferSelect
export type NewTableAssignment = typeof tableAssignments.$inferInsert
export type GuestRelationshipRecord = typeof guestRelationships.$inferSelect
export type NewGuestRelationship = typeof guestRelationships.$inferInsert
