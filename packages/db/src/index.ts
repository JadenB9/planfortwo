import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema/index.js'

// Lazy-initialize to avoid crashing at import time when DATABASE_URL is missing
// (e.g. during `next build` in CI where the webhook route bundles this module).
let _db: PostgresJsDatabase<typeof schema> | null = null

function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    const client = postgres(connectionString, { prepare: false })
    _db = drizzle(client, { schema })
  }
  return _db
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as never)[prop]
  },
})

export type Database = PostgresJsDatabase<typeof schema>

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
