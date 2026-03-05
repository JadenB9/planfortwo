import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'
import { checklistCategories } from './checklist-categories'
import { users } from './users'

export const taskPriorityEnum = pgEnum('task_priority', ['must_do', 'nice_to_have', 'optional'])

export const checklistTasks = pgTable('checklist_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => checklistCategories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedByUserId: uuid('completed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  assignedToUserId: uuid('assigned_to_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  priority: taskPriorityEnum('priority').notNull().default('nice_to_have'),
  sortOrder: integer('sort_order').notNull().default(0),
  isCustom: boolean('is_custom').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type ChecklistTaskRecord = typeof checklistTasks.$inferSelect
export type NewChecklistTask = typeof checklistTasks.$inferInsert
