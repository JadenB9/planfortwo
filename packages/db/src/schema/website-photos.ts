import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'
import { websiteSections } from './website-sections'

export const websitePhotos = pgTable('website_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id')
    .references(() => websiteSections.id, { onDelete: 'set null' }),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type WebsitePhotoRecord = typeof websitePhotos.$inferSelect
export type NewWebsitePhoto = typeof websitePhotos.$inferInsert
