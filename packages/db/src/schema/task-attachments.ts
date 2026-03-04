import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { checklistTasks } from './checklist-tasks'
import { users } from './users'

export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => checklistTasks.id, { onDelete: 'cascade' }),
  uploadedByUserId: uuid('uploaded_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type TaskAttachmentRecord = typeof taskAttachments.$inferSelect
export type NewTaskAttachment = typeof taskAttachments.$inferInsert
