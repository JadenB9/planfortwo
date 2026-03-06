import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { weddings } from './weddings'
import { households } from './households'

export const rsvpStatusEnum = pgEnum('rsvp_status', ['pending', 'accepted', 'declined', 'maybe'])

export const guestSideEnum = pgEnum('guest_side', ['bride', 'groom', 'both'])

export const guests = pgTable('guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'set null' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  rsvpToken: text('rsvp_token').unique(),
  rsvpStatus: rsvpStatusEnum('rsvp_status').notNull().default('pending'),
  rsvpRespondedAt: timestamp('rsvp_responded_at', { withTimezone: true }),
  mealChoice: text('meal_choice'),
  dietary: jsonb('dietary').$type<Record<string, unknown>>(),
  songRequest: text('song_request'),
  rsvpNotes: text('rsvp_notes'),
  hasPlusOne: boolean('has_plus_one').notNull().default(false),
  plusOneName: text('plus_one_name'),
  plusOneConfirmed: boolean('plus_one_confirmed').notNull().default(false),
  plusOneMealChoice: text('plus_one_meal_choice'),
  plusOneDietary: jsonb('plus_one_dietary').$type<Record<string, unknown>>(),
  isChild: boolean('is_child').notNull().default(false),
  age: integer('age'),
  side: guestSideEnum('side'),
  isVip: boolean('is_vip').notNull().default(false),
  inviteSentAt: timestamp('invite_sent_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type GuestRecord = typeof guests.$inferSelect
export type NewGuest = typeof guests.$inferInsert
