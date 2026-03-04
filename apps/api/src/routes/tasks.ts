import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTaskSchema,
  bulkReorderTasksSchema,
  createTaskNoteSchema,
  taskFiltersSchema,
} from '@planfortwo/validators'
import type { TimelineTemplate } from '@planfortwo/types'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { checklistService } from '../services/checklist.js'
import { weddingService } from '../services/weddings.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const tasksRoute = new Hono<Env>()

tasksRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /tasks?weddingId=X — list tasks with lazy seeding
tasksRoute.get(
  '/',
  resolveWeddingMiddleware,
  zValidator('query', taskFiltersSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const weddingId = c.get('weddingId')
    const dbUserId = c.get('dbUserId')
    const filters = c.req.valid('query')

    // Lazy seed if checklist hasn't been initialized
    const seeded = await checklistService.hasBeenSeeded(weddingId)
    if (!seeded) {
      const wedding = await weddingService.findByUserId(dbUserId)
      if (wedding) {
        await checklistService.seedChecklist(
          weddingId,
          wedding.timelineTemplate as TimelineTemplate,
          wedding.date ? new Date(wedding.date) : null,
          dbUserId,
        )
      }
    }

    const tasks = await checklistService.listTasks(filters)
    return c.json({ data: tasks })
  },
)

// GET /tasks/:id — task detail
tasksRoute.get('/:id', async (c) => {
  const taskId = c.req.param('id')
  const task = await checklistService.getTaskWithDetails(taskId)

  if (!task) {
    return c.json(
      { error: 'Task not found', code: 'TASK_NOT_FOUND', statusCode: 404 },
      404,
    )
  }

  return c.json({ data: task })
})

// POST /tasks — create task (gated)
tasksRoute.post(
  '/',
  requireFeature('canAddTasks'),
  zValidator('json', createTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')

    const task = await checklistService.createTask(data, dbUserId)
    return c.json({ data: task }, 201)
  },
)

// PUT /tasks/:id — update task (gated)
tasksRoute.put(
  '/:id',
  requireFeature('canEditChecklist'),
  zValidator('json', updateTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const taskId = c.req.param('id')
    const data = c.req.valid('json')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.req.query('weddingId')

    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    const updated = await checklistService.updateTask(taskId, data, dbUserId, weddingId)

    if (!updated) {
      return c.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// PATCH /tasks/:id/complete — toggle completion (gated)
tasksRoute.patch(
  '/:id/complete',
  requireFeature('canEditChecklist'),
  async (c) => {
    const taskId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.req.query('weddingId')

    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    const updated = await checklistService.toggleComplete(taskId, dbUserId, weddingId)

    if (!updated) {
      return c.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// PATCH /tasks/:id/reorder — single reorder (gated)
tasksRoute.patch(
  '/:id/reorder',
  requireFeature('canReorderTasks'),
  zValidator('json', reorderTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const taskId = c.req.param('id')
    const { sortOrder } = c.req.valid('json')

    const updated = await checklistService.reorderTask(taskId, sortOrder)

    if (!updated) {
      return c.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: updated })
  },
)

// DELETE /tasks/:id — delete task (gated)
tasksRoute.delete(
  '/:id',
  requireFeature('canDeleteTasks'),
  async (c) => {
    const taskId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.req.query('weddingId')

    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    try {
      await checklistService.deleteTask(taskId, dbUserId, weddingId)
      return c.json({ data: { success: true } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      return c.json(
        { error: message, code: 'DELETE_FAILED', statusCode: 404 },
        404,
      )
    }
  },
)

// POST /tasks/bulk-reorder — bulk reorder (gated)
tasksRoute.post(
  '/bulk-reorder',
  requireFeature('canReorderTasks'),
  zValidator('json', bulkReorderTasksSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const { tasks } = c.req.valid('json')
    await checklistService.bulkReorder(tasks)
    return c.json({ data: { success: true } })
  },
)

// POST /tasks/:id/notes — add note (gated)
tasksRoute.post(
  '/:id/notes',
  requireFeature('canAddNotes'),
  zValidator('json', createTaskNoteSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const taskId = c.req.param('id')
    const dbUserId = c.get('dbUserId')
    const weddingId = c.req.query('weddingId')
    const { content } = c.req.valid('json')

    if (!weddingId) {
      return c.json(
        { error: 'Wedding ID required', code: 'MISSING_WEDDING_ID', statusCode: 400 },
        400,
      )
    }

    const note = await checklistService.addNote(taskId, dbUserId, content, weddingId)
    return c.json({ data: note }, 201)
  },
)
