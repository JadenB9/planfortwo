import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const photoModerationEnum = pgEnum('photo_moderation', ['pending', 'approved', 'rejected'])

export const photoSourceEnum = pgEnum('photo_source', ['guest', 'professional', 'couple'])

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  thumbnailKey: text('thumbnail_key'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  width: integer('width'),
  height: integer('height'),
  uploaderName: text('uploader_name'),
  uploaderEmail: text('uploader_email'),
  source: photoSourceEnum('source').notNull().default('guest'),
  moderationStatus: photoModerationEnum('moderation_status').notNull().default('pending'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PhotoRecord = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
