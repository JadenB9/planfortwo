import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerChecklistTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'search_tasks',
    {
      description:
        'Search and filter wedding checklist tasks. Returns all tasks by default. ' +
        'Use filters to narrow results by category, completion status, priority, or keyword search. ' +
        'Useful for answering questions like "what tasks are left?", "what\'s due soon?", or "show urgent tasks".',
      inputSchema: z.object({
        categoryId: z.string().uuid().optional().describe('Filter by checklist category UUID'),
        status: z
          .enum(['all', 'completed', 'incomplete'])
          .optional()
          .describe('Filter by completion status. Defaults to "all"'),
        priority: z
          .enum(['must_do', 'nice_to_have', 'optional'])
          .optional()
          .describe('Filter by priority level'),
        search: z
          .string()
          .max(200)
          .optional()
          .describe('Free-text search across task titles and descriptions'),
        sortBy: z
          .enum(['dueDate', 'priority', 'sortOrder', 'createdAt'])
          .optional()
          .describe('Sort order for results. Defaults to "sortOrder"'),
      }),
    },
    async (input) => {
      const query: Record<string, string | number | boolean | undefined> = {}
      if (input.categoryId) query.categoryId = input.categoryId
      if (input.status) query.status = input.status
      if (input.priority) query.priority = input.priority
      if (input.search) query.search = input.search
      if (input.sortBy) query.sortBy = input.sortBy

      const result = await client.get('/tasks', query)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_task',
    {
      description:
        'Get full details for a single checklist task including its notes, category, and assignment info. ' +
        'Use this when you need complete information about a specific task.',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('The UUID of the task to retrieve'),
      }),
    },
    async (input) => {
      const result = await client.get(`/tasks/${input.taskId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_categories',
    {
      description:
        'List all checklist categories for the wedding with task counts. ' +
        'Categories group tasks (e.g., "Venue", "Attire", "Flowers"). ' +
        'Use this to understand the checklist structure or to get category IDs for filtering tasks.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/categories')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'create_task',
    {
      description:
        'Create a new checklist task. Requires a title and category. ' +
        'Use list_categories first to get valid category IDs. ' +
        'Priority defaults to "nice_to_have" if not specified.',
      inputSchema: z.object({
        title: z.string().min(1).max(500).describe('Task title (required)'),
        categoryId: z
          .string()
          .uuid()
          .describe('UUID of the checklist category this task belongs to (required)'),
        priority: z
          .enum(['must_do', 'nice_to_have', 'optional'])
          .optional()
          .describe('Task priority. Defaults to "nice_to_have"'),
        dueDate: z
          .string()
          .optional()
          .describe('Due date in ISO 8601 datetime format (e.g., "2026-06-15T00:00:00.000Z")'),
        description: z
          .string()
          .max(2000)
          .optional()
          .describe('Longer description or details for the task'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        title: input.title,
        categoryId: input.categoryId,
      }
      if (input.priority) body.priority = input.priority
      if (input.dueDate) body.dueDate = input.dueDate
      if (input.description) body.description = input.description

      const result = await client.post('/tasks', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_task',
    {
      description:
        'Update an existing checklist task. Only provide the fields you want to change. ' +
        'Use get_task first to see current values if needed.',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('The UUID of the task to update (required)'),
        title: z.string().min(1).max(500).optional().describe('New task title'),
        priority: z
          .enum(['must_do', 'nice_to_have', 'optional'])
          .optional()
          .describe('New priority level'),
        dueDate: z.string().optional().describe('New due date in ISO 8601 datetime format'),
        description: z.string().max(2000).optional().describe('New description'),
        categoryId: z
          .string()
          .uuid()
          .optional()
          .describe('Move task to a different category by providing its UUID'),
      }),
    },
    async (input) => {
      const { taskId, ...fields } = input
      const body: Record<string, unknown> = {}
      if (fields.title !== undefined) body.title = fields.title
      if (fields.priority !== undefined) body.priority = fields.priority
      if (fields.dueDate !== undefined) body.dueDate = fields.dueDate
      if (fields.description !== undefined) body.description = fields.description
      if (fields.categoryId !== undefined) body.categoryId = fields.categoryId

      const result = await client.put(`/tasks/${taskId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'complete_task',
    {
      description:
        'Toggle a task between completed and incomplete. ' +
        'If the task is currently incomplete, it will be marked as completed, and vice versa.',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('The UUID of the task to toggle completion on'),
      }),
    },
    async (input) => {
      const result = await client.patch(`/tasks/${input.taskId}/complete`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'delete_task',
    {
      description:
        'Permanently delete a checklist task. This action cannot be undone. ' +
        'Use with caution — confirm with the user before deleting.',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('The UUID of the task to delete'),
      }),
    },
    async (input) => {
      const result = await client.del(`/tasks/${input.taskId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_task_note',
    {
      description:
        'Add a note to a checklist task. Notes are appended (not replaced) and include timestamps. ' +
        'Useful for recording decisions, vendor info, or reminders related to a task.',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('The UUID of the task to add a note to'),
        content: z.string().min(1).max(5000).describe('The note text content'),
      }),
    },
    async (input) => {
      const result = await client.post(`/tasks/${input.taskId}/notes`, {
        content: input.content,
      })
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
