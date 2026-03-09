import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerCeremonyTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'list_ceremony_outlines',
    {
      description:
        'List all ceremony outline entries for the wedding. Each entry represents a moment in the ceremony ' +
        '(e.g., processional, vows, ring exchange). Returns moment type, title, description, duration, and sort order.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/ceremony/outlines')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_vows',
    {
      description:
        'Get the saved vows for the current user. Returns the vow content and whether it has been revealed to the partner.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/ceremony/vows')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_processional',
    {
      description:
        'List the processional order for the ceremony. Returns each entry with name, role, and sort order.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/ceremony/processional')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'create_ceremony_outline',
    {
      description:
        'Add a new entry to the ceremony outline. Each entry represents a moment like the processional, ' +
        'vows, ring exchange, etc. Use list_ceremony_outlines to see existing entries.',
      inputSchema: z.object({
        title: z.string().min(1).max(200).describe('Title of the ceremony moment (required)'),
        moment: z
          .enum([
            'prelude',
            'processional',
            'welcome',
            'reading',
            'vows',
            'ring_exchange',
            'unity_ceremony',
            'pronouncement',
            'recessional',
            'other',
          ])
          .describe('Type of ceremony moment (required)'),
        description: z
          .string()
          .max(2000)
          .optional()
          .describe('Detailed description or script for this moment'),
        duration: z
          .number()
          .int()
          .min(1)
          .max(120)
          .optional()
          .describe('Estimated duration in minutes'),
        sortOrder: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Position in the ceremony order (0-based)'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        moment: input.moment,
        title: input.title,
      }
      if (input.description) body.description = input.description
      if (input.duration !== undefined) body.duration = input.duration
      if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder

      const result = await client.post('/ceremony/outlines', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_ceremony_outline',
    {
      description:
        'Update an existing ceremony outline entry. Only provide the fields you want to change. ' +
        'Use list_ceremony_outlines first to get the entry ID.',
      inputSchema: z.object({
        outlineId: z.string().uuid().describe('The UUID of the outline entry to update (required)'),
        title: z.string().min(1).max(200).optional().describe('New title'),
        moment: z
          .enum([
            'prelude',
            'processional',
            'welcome',
            'reading',
            'vows',
            'ring_exchange',
            'unity_ceremony',
            'pronouncement',
            'recessional',
            'other',
          ])
          .optional()
          .describe('New moment type'),
        description: z.string().max(2000).optional().describe('New description'),
        duration: z.number().int().min(1).max(120).optional().describe('New duration in minutes'),
        sortOrder: z.number().int().min(0).optional().describe('New sort order position'),
      }),
    },
    async (input) => {
      const { outlineId, ...fields } = input
      const body: Record<string, unknown> = {}
      if (fields.title !== undefined) body.title = fields.title
      if (fields.moment !== undefined) body.moment = fields.moment
      if (fields.description !== undefined) body.description = fields.description
      if (fields.duration !== undefined) body.duration = fields.duration
      if (fields.sortOrder !== undefined) body.sortOrder = fields.sortOrder

      const result = await client.put(`/ceremony/outlines/${outlineId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_vows',
    {
      description:
        "Save or update the current user's wedding vows. The content is private until isRevealed is set to true.",
      inputSchema: z.object({
        content: z.string().max(10000).describe('The vow text content (required)'),
        isRevealed: z
          .boolean()
          .optional()
          .describe('Whether to reveal the vows to the partner. Defaults to false'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        content: input.content,
      }
      if (input.isRevealed !== undefined) body.isRevealed = input.isRevealed

      const result = await client.put('/ceremony/vows', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_processional_entry',
    {
      description:
        'Add a person to the ceremony processional order. Specify the name and optionally their role ' +
        '(e.g., "flower girl", "best man") and position in the order.',
      inputSchema: z.object({
        name: z
          .string()
          .min(1)
          .max(200)
          .describe('Name of the person in the processional (required)'),
        role: z
          .string()
          .max(100)
          .optional()
          .describe('Role in the processional, e.g. "flower girl", "groomsman"'),
        sortOrder: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Position in the processional order (0-based)'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        name: input.name,
      }
      if (input.role) body.role = input.role
      if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder

      const result = await client.post('/ceremony/processional', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
