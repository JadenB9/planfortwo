import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerBudgetTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'list_budget_items',
    {
      description:
        'List wedding budget line items (expenses). Supports filtering by category, payment status, ' +
        'payer, and keyword search. Returns paginated results. ' +
        'Use this to answer questions like "how much have we spent on flowers?" or "what\'s still unpaid?".',
      inputSchema: z.object({
        categoryId: z.string().uuid().optional().describe('Filter by budget category UUID'),
        paymentStatus: z
          .enum(['unpaid', 'deposit', 'partial', 'paid'])
          .optional()
          .describe('Filter by payment status'),
        payer: z
          .enum(['couple', 'bride_family', 'groom_family', 'other'])
          .optional()
          .describe('Filter by who is paying'),
        search: z
          .string()
          .max(200)
          .optional()
          .describe('Free-text search across expense descriptions and vendor names'),
        sortBy: z
          .enum(['amount', 'dueDate', 'createdAt', 'sortOrder'])
          .optional()
          .describe('Sort order for results. Defaults to "sortOrder"'),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Page number for pagination. Defaults to 1'),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Items per page (1-100). Defaults to 20'),
      }),
    },
    async (input) => {
      const query: Record<string, string | number | boolean | undefined> = {}
      if (input.categoryId) query.categoryId = input.categoryId
      if (input.paymentStatus) query.paymentStatus = input.paymentStatus
      if (input.payer) query.payer = input.payer
      if (input.search) query.search = input.search
      if (input.sortBy) query.sortBy = input.sortBy
      if (input.page) query.page = input.page
      if (input.pageSize) query.pageSize = input.pageSize

      const result = await client.get('/budget-items', query)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_budget_analytics',
    {
      description:
        'Get comprehensive budget analytics including total budget, total spent, remaining balance, ' +
        'spending by category, and trend data. This is the best tool for answering high-level budget ' +
        'questions like "are we over budget?" or "what category has the most spending?".',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/budget/analytics')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_budget_tips',
    {
      description:
        "Get personalized budget saving tips and suggestions based on the wedding's current spending patterns. " +
        'Useful when the couple asks for advice on saving money or optimizing their budget.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/budget/tips')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_budget_categories',
    {
      description:
        'List all budget categories (e.g., "Venue", "Catering", "Photography") with their allocated amounts. ' +
        'Use this to get category IDs for filtering budget items or when creating new expenses.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/budget-categories')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'export_budget_csv',
    {
      description:
        'Export the entire wedding budget as a CSV file. Returns raw CSV text content. ' +
        'Use this when the couple wants a spreadsheet export of their budget data.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/budget/export/csv')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_payment_schedule',
    {
      description:
        'List scheduled payments with optional filtering. Shows upcoming vendor payments, due dates, ' +
        'and paid status. Use this to answer "what payments are coming up?" or "are any payments overdue?".',
      inputSchema: z.object({
        filter: z
          .enum(['upcoming', 'overdue', 'all'])
          .optional()
          .describe(
            'Filter payments. "upcoming" shows future unpaid, "overdue" shows past-due. Defaults to "all"',
          ),
      }),
    },
    async (input) => {
      const query: Record<string, string | number | boolean | undefined> = {}
      if (input.filter) query.filter = input.filter

      const result = await client.get('/payment-schedule', query)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'add_expense',
    {
      description:
        'Add a new budget expense/line item. Requires a description and category. ' +
        'Use list_budget_categories first to get valid category IDs. ' +
        'The "amount" field is the estimated or actual cost.',
      inputSchema: z.object({
        description: z
          .string()
          .min(1)
          .max(500)
          .describe('Expense description (required), e.g., "DJ for reception"'),
        categoryId: z
          .string()
          .uuid()
          .describe(
            'UUID of the budget category (required). Use list_budget_categories to find IDs',
          ),
        amount: z
          .number()
          .min(0)
          .max(10_000_000)
          .describe('Estimated or total cost amount in dollars (required)'),
        paidAmount: z
          .number()
          .min(0)
          .max(10_000_000)
          .optional()
          .describe('Amount already paid in dollars'),
        paymentStatus: z
          .enum(['unpaid', 'deposit', 'partial', 'paid'])
          .optional()
          .describe('Payment status. Defaults to "unpaid"'),
        payer: z
          .enum(['couple', 'bride_family', 'groom_family', 'other'])
          .optional()
          .describe('Who is paying for this expense'),
        vendorName: z
          .string()
          .max(200)
          .optional()
          .describe('Name of the vendor providing this service/item'),
        notes: z.string().max(2000).optional().describe('Additional notes about this expense'),
        dueDate: z.string().optional().describe('Payment due date in ISO 8601 datetime format'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        description: input.description,
        categoryId: input.categoryId,
        amount: input.amount,
      }
      if (input.paidAmount !== undefined) body.paidAmount = input.paidAmount
      if (input.paymentStatus) body.paymentStatus = input.paymentStatus
      if (input.payer) body.payer = input.payer
      if (input.vendorName) body.vendorName = input.vendorName
      if (input.notes) body.notes = input.notes
      if (input.dueDate) body.dueDate = input.dueDate

      const result = await client.post('/budget-items', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_expense',
    {
      description:
        'Update an existing budget expense. Only provide the fields you want to change. ' +
        'Use list_budget_items first to find the expense ID.',
      inputSchema: z.object({
        itemId: z.string().uuid().describe('The UUID of the budget item to update (required)'),
        description: z.string().min(1).max(500).optional().describe('New description'),
        categoryId: z.string().uuid().optional().describe('Move to a different budget category'),
        amount: z.number().min(0).max(10_000_000).optional().describe('New estimated/total cost'),
        paidAmount: z.number().min(0).max(10_000_000).optional().describe('New amount paid'),
        paymentStatus: z
          .enum(['unpaid', 'deposit', 'partial', 'paid'])
          .optional()
          .describe('New payment status'),
        payer: z
          .enum(['couple', 'bride_family', 'groom_family', 'other'])
          .optional()
          .describe('New payer'),
        vendorName: z.string().max(200).optional().describe('New vendor name'),
        notes: z.string().max(2000).optional().describe('New notes'),
        dueDate: z.string().optional().describe('New due date in ISO 8601 datetime format'),
      }),
    },
    async (input) => {
      const { itemId, ...fields } = input
      const body: Record<string, unknown> = {}
      if (fields.description !== undefined) body.description = fields.description
      if (fields.categoryId !== undefined) body.categoryId = fields.categoryId
      if (fields.amount !== undefined) body.amount = fields.amount
      if (fields.paidAmount !== undefined) body.paidAmount = fields.paidAmount
      if (fields.paymentStatus !== undefined) body.paymentStatus = fields.paymentStatus
      if (fields.payer !== undefined) body.payer = fields.payer
      if (fields.vendorName !== undefined) body.vendorName = fields.vendorName
      if (fields.notes !== undefined) body.notes = fields.notes
      if (fields.dueDate !== undefined) body.dueDate = fields.dueDate

      const result = await client.put(`/budget-items/${itemId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'delete_expense',
    {
      description:
        'Permanently delete a budget expense. This action cannot be undone. ' +
        'Confirm with the user before deleting.',
      inputSchema: z.object({
        itemId: z.string().uuid().describe('The UUID of the budget item to delete'),
      }),
    },
    async (input) => {
      const result = await client.del(`/budget-items/${input.itemId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'create_budget_category',
    {
      description:
        'Create a new budget category to organize expenses (e.g., "Stationery", "Favors"). ' +
        'Requires a name, icon emoji, hex color, and optionally an allocated budget amount.',
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe('Category name (required), e.g., "Stationery"'),
        icon: z
          .string()
          .min(1)
          .max(50)
          .describe('Icon identifier or emoji for the category (required)'),
        color: z.string().describe('Hex color code for the category (required), e.g., "#FF6B6B"'),
        allocatedAmount: z
          .number()
          .min(0)
          .max(10_000_000)
          .optional()
          .describe('Allocated budget amount in dollars for this category'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        name: input.name,
        icon: input.icon,
        color: input.color,
      }
      if (input.allocatedAmount !== undefined) body.allocatedAmount = input.allocatedAmount

      const result = await client.post('/budget-categories', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'seed_budget_defaults',
    {
      description:
        'Seed the wedding budget with the 23 default budget categories (Venue, Catering, Photography, etc.). ' +
        "Only use this if the couple hasn't set up their budget yet. " +
        'Optionally provide a total budget to auto-distribute allocations across categories.',
      inputSchema: z.object({
        totalBudget: z
          .number()
          .min(0)
          .max(10_000_000)
          .optional()
          .describe(
            'Total wedding budget in dollars. If provided, allocations are distributed proportionally',
          ),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {}
      if (input.totalBudget !== undefined) body.totalBudget = input.totalBudget

      const result = await client.post('/budget-categories/seed-defaults', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'create_payment',
    {
      description:
        'Create a scheduled payment linked to a budget item. Use this to track upcoming vendor payments, ' +
        'deposit due dates, and final payment deadlines. Requires a budget item ID — use list_budget_items ' +
        'to find the right one.',
      inputSchema: z.object({
        budgetItemId: z
          .string()
          .uuid()
          .describe('UUID of the budget item this payment is for (required)'),
        title: z
          .string()
          .min(1)
          .max(200)
          .describe('Payment title (required), e.g., "Venue deposit" or "Final DJ payment"'),
        amount: z.number().min(0).max(10_000_000).describe('Payment amount in dollars (required)'),
        dueDate: z.string().describe('Payment due date in ISO 8601 datetime format (required)'),
        notes: z.string().max(2000).optional().describe('Additional notes about this payment'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        budgetItemId: input.budgetItemId,
        title: input.title,
        amount: input.amount,
        dueDate: input.dueDate,
      }
      if (input.notes) body.notes = input.notes

      const result = await client.post('/payment-schedule', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
