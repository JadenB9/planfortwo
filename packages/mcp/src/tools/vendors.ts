import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerVendorTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'list_vendors',
    {
      description:
        'List all vendors for the wedding. Returns vendor name, category, status, contact info, and cost. ' +
        'Use this to get an overview of all booked or researched vendors.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/vendors')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_vendor',
    {
      description:
        'Get full details for a single vendor including communications log, contracts, and contact info. ' +
        'Use this when you need complete information about a specific vendor.',
      inputSchema: z.object({
        vendorId: z.string().uuid().describe('The UUID of the vendor to retrieve'),
      }),
    },
    async (input) => {
      const result = await client.get(`/vendors/${input.vendorId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'create_vendor',
    {
      description:
        'Add a new vendor to the wedding. Requires name and category. ' +
        'Categories include photographer, caterer, florist, dj, venue, planner, and other. ' +
        'Status defaults to "researching" if not specified.',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Vendor business name (required)'),
        category: z
          .string()
          .min(1)
          .max(100)
          .describe(
            'Vendor category, e.g. "photographer", "caterer", "florist", "dj", "venue", "planner", "other" (required)',
          ),
        status: z
          .enum(['researching', 'contacted', 'quoted', 'booked', 'paid', 'completed'])
          .optional()
          .describe('Vendor status. Defaults to "researching"'),
        contactName: z.string().max(200).optional().describe('Primary contact person name'),
        email: z.string().email().optional().describe('Contact email address'),
        phone: z.string().max(30).optional().describe('Contact phone number'),
        website: z.string().max(500).optional().describe('Vendor website URL'),
        notes: z.string().max(2000).optional().describe('Additional notes about the vendor'),
        cost: z.number().min(0).max(10_000_000).optional().describe('Estimated or actual cost'),
        depositAmount: z.number().min(0).max(10_000_000).optional().describe('Deposit amount'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        name: input.name,
        category: input.category,
      }
      if (input.status) body.status = input.status
      if (input.contactName) body.contactName = input.contactName
      if (input.email) body.email = input.email
      if (input.phone) body.phone = input.phone
      if (input.website) body.website = input.website
      if (input.notes) body.notes = input.notes
      if (input.cost !== undefined) body.cost = input.cost
      if (input.depositAmount !== undefined) body.depositAmount = input.depositAmount

      const result = await client.post('/vendors', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_vendor',
    {
      description:
        'Update an existing vendor. Only provide the fields you want to change. ' +
        'Use get_vendor first to see current values if needed.',
      inputSchema: z.object({
        vendorId: z.string().uuid().describe('The UUID of the vendor to update (required)'),
        name: z.string().min(1).max(200).optional().describe('New vendor name'),
        category: z.string().min(1).max(100).optional().describe('New vendor category'),
        status: z
          .enum(['researching', 'contacted', 'quoted', 'booked', 'paid', 'completed'])
          .optional()
          .describe('New vendor status'),
        contactName: z.string().max(200).optional().describe('New contact person name'),
        email: z.string().email().optional().describe('New contact email'),
        phone: z.string().max(30).optional().describe('New contact phone'),
        website: z.string().max(500).optional().describe('New vendor website URL'),
        notes: z.string().max(2000).optional().describe('New notes'),
        cost: z.number().min(0).max(10_000_000).optional().describe('New cost amount'),
        depositAmount: z.number().min(0).max(10_000_000).optional().describe('New deposit amount'),
      }),
    },
    async (input) => {
      const { vendorId, ...fields } = input
      const body: Record<string, unknown> = {}
      if (fields.name !== undefined) body.name = fields.name
      if (fields.category !== undefined) body.category = fields.category
      if (fields.status !== undefined) body.status = fields.status
      if (fields.contactName !== undefined) body.contactName = fields.contactName
      if (fields.email !== undefined) body.email = fields.email
      if (fields.phone !== undefined) body.phone = fields.phone
      if (fields.website !== undefined) body.website = fields.website
      if (fields.notes !== undefined) body.notes = fields.notes
      if (fields.cost !== undefined) body.cost = fields.cost
      if (fields.depositAmount !== undefined) body.depositAmount = fields.depositAmount

      const result = await client.put(`/vendors/${vendorId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'delete_vendor',
    {
      description:
        'Permanently delete a vendor and all associated communications and contracts. ' +
        'This action cannot be undone. Confirm with the user before deleting.',
      inputSchema: z.object({
        vendorId: z.string().uuid().describe('The UUID of the vendor to delete'),
      }),
    },
    async (input) => {
      const result = await client.del(`/vendors/${input.vendorId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_vendor_communication',
    {
      description:
        'Log a communication with a vendor (email, phone call, meeting, etc.). ' +
        'Tracks the date, type, subject, and content of the interaction. ' +
        'Use get_vendor first to verify the vendor exists.',
      inputSchema: z.object({
        vendorId: z
          .string()
          .uuid()
          .describe('The UUID of the vendor this communication is with (required)'),
        content: z.string().min(1).max(5000).describe('Details of the communication (required)'),
        type: z
          .string()
          .min(1)
          .max(50)
          .optional()
          .describe('Communication type, e.g. "email", "phone", "meeting", "other"'),
        subject: z.string().max(200).optional().describe('Subject or topic of the communication'),
        contactDate: z
          .string()
          .optional()
          .describe('Date of communication in ISO 8601 datetime format. Defaults to now'),
        followUpDate: z.string().optional().describe('Follow-up date in ISO 8601 datetime format'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        vendorId: input.vendorId,
        content: input.content,
      }
      if (input.type) body.type = input.type
      if (input.subject) body.subject = input.subject
      if (input.contactDate) body.contactDate = input.contactDate
      if (input.followUpDate) body.followUpDate = input.followUpDate

      const result = await client.post(`/vendors/${input.vendorId}/communications`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
