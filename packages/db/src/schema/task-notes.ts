import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { checklistTasks } from './checklist-tasks'
import { users } from './users'

export const taskNotes = pgTable('task_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => checklistTasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type TaskNoteRecord = typeof taskNotes.$inferSelect
export type NewTaskNote = typeof taskNotes.$inferInsert
