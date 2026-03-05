# Shared Codebase Patterns for Phase Agents

## PROJECT ROOT
/Users/jaden/Library/Mobile Documents/com~apple~CloudDocs/Projects/planfortwo

## CRITICAL RULES
1. TypeScript strict, NO `any` types
2. Create ONLY NEW files — do NOT modify any existing files
3. Do NOT modify barrel/index files (schema/index.ts, types/index.ts, validators/index.ts, api/index.ts)
4. All test UUIDs must use hex chars only (0-9, a-f) — NOT p/g/w prefixes
5. Use `as never` for mock return type assertions in tests
6. vi.clearAllMocks() in beforeEach clears factory mocks — always re-set mocks in beforeEach
7. Zod validation on all API endpoints
8. Service layer pattern: routes -> services -> Drizzle

## DB SCHEMA PATTERN (packages/db/src/schema/budget-categories.ts)
```typescript
import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const payerEnum = pgEnum('payer', ['couple', 'bride_family', 'groom_family', 'other'])

export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // ... fields
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type BudgetCategoryRecord = typeof budgetCategories.$inferSelect
export type NewBudgetCategory = typeof budgetCategories.$inferInsert
```

## ROUTE PATTERN (apps/api/src/routes/budget-categories.ts)
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createBudgetCategorySchema, updateBudgetCategorySchema } from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { budgetCategoryService } from '../services/budget-categories.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const budgetCategoriesRoute = new Hono<Env>()
budgetCategoriesRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET — list
budgetCategoriesRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const items = await budgetCategoryService.list(weddingId)
  return c.json({ data: items })
})

// POST — create (gated)
budgetCategoriesRoute.post('/', requireFeature('canBudgetCategories'),
  zValidator('json', createBudgetCategorySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const item = await budgetCategoryService.create(data, dbUserId)
    return c.json({ data: item }, 201)
  }
)
```

## SERVICE PATTERN (apps/api/src/services/budget-categories.ts)
```typescript
import { eq, and, asc, sql } from 'drizzle-orm'
import { db, budgetCategories } from '@planfortwo/db'
import type { CreateBudgetCategoryInput } from '@planfortwo/validators'
import { activityService } from './activity.js'

export const budgetCategoryService = {
  async list(weddingId: string) {
    return db.select().from(budgetCategories)
      .where(eq(budgetCategories.weddingId, weddingId))
      .orderBy(asc(budgetCategories.sortOrder))
  },
  async create(data: CreateBudgetCategoryInput, userId: string) {
    const [item] = await db.insert(budgetCategories).values({...}).returning()
    await activityService.log({...})
    return item
  },
}
```

## TEST PATTERN (apps/api/src/routes/budget-categories.test.ts)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    }),
    findById: vi.fn().mockResolvedValue({
      id: 'db-user-id', email: 'test@example.com', firstName: 'Jane', lastName: 'Doe',
    }),
  },
}))

vi.mock('../services/weddings.js', () => ({
  weddingService: {
    verifyMembership: vi.fn().mockResolvedValue({
      id: 'member-1', weddingId: 'a0000000-0000-0000-0000-000000000001',
      userId: 'db-user-id', role: 'owner', joinedAt: new Date(),
    }),
    findByUserId: vi.fn(),
  },
}))

vi.mock('../services/YOUR_SERVICE.js', () => ({
  yourService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

vi.mock('../services/features.js', () => ({
  featureService: {
    getFeatures: vi.fn().mockResolvedValue({
      tier: 'full', canSeatingChart: true, canVendorManagement: true,
      // ... all gates set to true
    }),
  },
}))

import { yourRoute } from './your-route.js'
import { yourService } from '../services/your-service.js'
import { featureService } from '../services/features.js'

const mockedService = vi.mocked(yourService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'

// FULL_GATES and FREE_GATES objects with ALL feature flags

function createApp() {
  const app = new Hono()
  app.route('/your-route', yourRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Your Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })
  // tests...
})
```

## FEATURE GATES (all keys needed in test mocks)
```typescript
const FULL_GATES = {
  tier: 'full' as const,
  canAddTasks: true, canEditChecklist: true, canDeleteTasks: true,
  canReorderTasks: true, canCustomizeCategories: true, canAddNotes: true,
  canAddAttachments: true, maxGuests: null, canEditGuests: true,
  canDeleteGuests: true, canBulkImport: true, canRsvp: true,
  canSeatingChart: true, canVendorManagement: true, canCustomDomain: true,
  canDataExport: true, canBudgetCategories: true, canBudgetExpenses: true,
  canBudgetAnalytics: true, canBudgetExport: true, canPaymentSchedule: true,
  canWebsiteBuilder: true, canWebsiteAnalytics: true, canWebsiteCustomSections: true,
}
```

## EXISTING DB TABLES (for foreign key references)
- weddings (id, name, date, ...)
- guests (id, weddingId, firstName, lastName, householdId, ...)
- budgetItems (id, weddingId, categoryId, ...)

## FILE NAMING CONVENTION
- Schema: packages/db/src/schema/your-table.ts
- Types: packages/types/src/your-types.ts (or add to index.ts)
- Validators: packages/validators/src/your-validators.ts (or add to index.ts)
- Service: apps/api/src/services/your-service.ts
- Route: apps/api/src/routes/your-route.ts
- Test: apps/api/src/routes/your-route.test.ts
