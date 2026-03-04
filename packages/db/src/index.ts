import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema/index.js'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })

export type Database = typeof db

export * from './schema/index.js'
export { defaultCategories, getTemplateTasks } from './templates/index.js'
export type { TemplateTask, TemplateCategory } from './templates/index.js'
export { defaultGuestTags } from './templates/default-guest-tags.js'
export type { DefaultGuestTag } from './templates/default-guest-tags.js'
export { defaultBudgetCategories } from './templates/budget-categories.js'
export type { DefaultBudgetCategory } from './templates/budget-categories.js'
export { tipDefaults } from './templates/tip-defaults.js'
export type { TipDefault } from './templates/tip-defaults.js'
export { defaultWebsiteSections } from './templates/website-sections.js'
export type { DefaultWebsiteSection } from './templates/website-sections.js'
