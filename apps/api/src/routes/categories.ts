import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createCategorySchema, updateCategorySchema } from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { checklistService } from '../services/checklist.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const categoriesRoute = new Hono<Env>()

categoriesRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /categories?weddingId=X — list categories with counts
categoriesRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const categories = await checklistService.listCategories(weddingId)
  return c.json({ data: categories })
})

// POST /categories — create category (gated)
categoriesRoute.post(
  '/',
  resolveWeddingMiddleware,
  requireFeature('canCustomizeCategories'),
  zValidator('json', createCategorySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    const category = await checklistService.createCategory(data, dbUserId)
    return c.json({ data: category }, 201)
  },
)

// PUT /categories/:id — update category (gated)
categoriesRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canCustomizeCategories'),
  zValidator('json', updateCategorySchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const categoryId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')

    const updated = await checklistService.updateCategory(categoryId, weddingId, data)

    if (!updated) {
      return c.json(
        { error: 'Category not found', code: 'CATEGORY_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /categories/:id — delete category (gated)
categoriesRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canCustomizeCategories'),
  async (c) => {
    const categoryId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.get('weddingId')

    try {
      await checklistService.deleteCategory(categoryId, dbUserId, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      console.error('Delete category failed:', err)
      const isDefault = message.includes('default')
      const code = isDefault ? 'DEFAULT_CATEGORY' : 'DELETE_FAILED'
      const status = isDefault ? 400 : 404
      const genericMsg = isDefault ? 'Cannot delete default category' : 'Delete failed'

      return c.json({ error: genericMsg, code, statusCode: status }, status)
    }
  },
)
