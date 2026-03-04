import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const websitePageViews = pgTable('website_page_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  visitorId: text('visitor_id').notNull(),
  path: text('path').notNull().default('/'),
  sectionViewed: text('section_viewed'),
  referrer: text('referrer'),
  country: text('country'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type WebsitePageViewRecord = typeof websitePageViews.$inferSelect
export type NewWebsitePageView = typeof websitePageViews.$inferInsert
