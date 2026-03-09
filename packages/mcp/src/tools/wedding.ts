import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerWeddingTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read Tools (available in all modes) ──

  server.registerTool(
    'get_wedding',
    {
      description:
        'Get the current wedding details including name, date, venue, location, budget, style, member list, and days until the wedding. Use this to understand the overall wedding context.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/weddings/mine')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'get_dashboard',
    {
      description:
        'Get dashboard statistics for the wedding including checklist progress, guest count, RSVP summary, budget overview, and upcoming tasks. Use this for a high-level snapshot of wedding planning status.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/dashboard/stats')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'get_recent_activity',
    {
      description:
        'Get the recent activity feed for the wedding. Shows actions taken by team members such as adding guests, updating budget items, completing tasks, etc. Useful for seeing what has changed recently.',
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Maximum number of activity entries to return (default 20, max 100)'),
      }),
    },
    async ({ limit }) => {
      const result = await client.get('/activity', { limit: limit ?? 20 })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'list_wedding_members',
    {
      description:
        "List all team members of the wedding including owners, partners, planners, and family members. Shows each member's name, email, role, and when they joined.",
      inputSchema: z.object({
        weddingId: z.string().describe('The wedding ID. Use get_wedding to find this.'),
      }),
    },
    async ({ weddingId }) => {
      const result = await client.get(`/weddings/${weddingId}/members`)
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'get_features',
    {
      description:
        'Get the current feature gates and subscription tier for the wedding. Shows which features are available (e.g., guest limits, seating chart access, export capabilities) based on the subscription plan.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/features')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // ── Write Tools (admin mode only) ──

  if (mode === 'admin') {
    server.registerTool(
      'update_wedding',
      {
        description:
          'Update wedding details such as name, date, venue, location, budget, or style. Only include the fields you want to change; omitted fields remain unchanged.',
        inputSchema: z.object({
          weddingId: z.string().describe('The wedding ID to update. Use get_wedding to find this.'),
          name: z
            .string()
            .min(1)
            .max(200)
            .optional()
            .describe('Wedding name (e.g., "Sarah & James")'),
          date: z
            .string()
            .optional()
            .describe(
              'Wedding date in ISO 8601 format (e.g., "2026-09-15T00:00:00.000Z"). Set to null to clear.',
            ),
          venue: z.string().max(200).optional().describe('Venue name (e.g., "The Grand Ballroom")'),
          city: z.string().max(100).optional().describe('City where the wedding is held'),
          state: z.string().max(100).optional().describe('State or province'),
          country: z.string().max(100).optional().describe('Country (default "US")'),
          estimatedBudget: z
            .number()
            .min(0)
            .max(10_000_000)
            .optional()
            .describe('Total wedding budget in dollars'),
          style: z
            .enum([
              'traditional',
              'modern',
              'rustic',
              'bohemian',
              'glamorous',
              'minimalist',
              'vintage',
              'destination',
              'garden',
              'beach',
              'whimsical',
            ])
            .optional()
            .describe('Wedding style/theme'),
        }),
      },
      async ({ weddingId, name, date, venue, city, state, country, estimatedBudget, style }) => {
        const body: Record<string, unknown> = {}
        if (name !== undefined) body.name = name
        if (date !== undefined) body.date = date
        if (venue !== undefined) body.venue = venue
        if (city !== undefined) body.city = city
        if (state !== undefined) body.state = state
        if (country !== undefined) body.country = country
        if (estimatedBudget !== undefined) body.budgetTotal = estimatedBudget
        if (style !== undefined) body.style = style

        const result = await client.put(`/weddings/${weddingId}`, body)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'add_wedding_member',
      {
        description:
          'Add a new team member to the wedding by their email address. They will receive an invitation email. Only owners and partners can add members.',
        inputSchema: z.object({
          weddingId: z
            .string()
            .describe('The wedding ID to add the member to. Use get_wedding to find this.'),
          email: z.string().describe('Email address of the person to invite'),
          role: z
            .enum(['planner', 'family'])
            .describe(
              'Role for the new member. "planner" can manage most wedding details. "family" has read-heavy access.',
            ),
        }),
      },
      async ({ weddingId, email, role }) => {
        const result = await client.post(`/weddings/${weddingId}/members`, { email, role })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )
  }
}
