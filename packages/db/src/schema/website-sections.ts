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

export const websiteSectionTypeEnum = pgEnum('website_section_type', [
  'hero',
  'our_story',
  'event_details',
  'wedding_party',
  'gallery',
  'travel',
  'things_to_do',
  'registry',
  'faq',
  'rsvp',
  'schedule',
  'guestbook',
  'custom',
  'song_requests',
])

export const websiteSections = pgTable('website_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  sectionType: websiteSectionTypeEnum('section_type').notNull(),
  title: text('title').notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull().default({}),
  isVisible: boolean('is_visible').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type WebsiteSectionRecord = typeof websiteSections.$inferSelect
export type NewWebsiteSection = typeof websiteSections.$inferInsert
