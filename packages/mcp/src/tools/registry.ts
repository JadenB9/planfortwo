import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerRegistryTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'list_registry_links',
    {
      description:
        'List all registry store links for the wedding. Each link points to an external registry ' +
        '(e.g., Amazon, Target, Crate & Barrel) where guests can browse and purchase gifts.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/registry/links')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_registry_gifts',
    {
      description:
        'List all received gifts tracked for the wedding. Includes gift description, giver name, ' +
        'estimated value, thank-you status, and notes.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/registry/gifts')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_cash_funds',
    {
      description:
        'List all cash funds for the wedding (e.g., honeymoon fund, house fund). ' +
        'Returns fund name, description, goal amount, and current contributions.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/registry/funds')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'add_registry_link',
    {
      description:
        'Add a registry store link. This creates a clickable link on the wedding website ' +
        'pointing guests to an external registry store.',
      inputSchema: z.object({
        storeName: z
          .string()
          .min(1)
          .max(200)
          .describe('Name of the store, e.g. "Amazon", "Target" (required)'),
        url: z.string().url().describe('Full URL to the registry page (required)'),
        logoUrl: z.string().url().optional().describe('URL to the store logo image'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        storeName: input.storeName,
        url: input.url,
      }
      if (input.logoUrl) body.logoUrl = input.logoUrl

      const result = await client.post('/registry/links', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_registry_gift',
    {
      description:
        'Track a received gift. Use this to log gifts that have been received, for thank-you note tracking. ' +
        'Requires a description of the gift.',
      inputSchema: z.object({
        description: z.string().min(1).max(500).describe('Description of the gift (required)'),
        guestName: z.string().max(200).optional().describe('Name of the person who gave the gift'),
        estimatedValue: z
          .number()
          .min(0)
          .max(1_000_000)
          .optional()
          .describe('Estimated monetary value of the gift'),
        notes: z.string().max(2000).optional().describe('Additional notes about the gift'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        description: input.description,
      }
      if (input.guestName) body.guestName = input.guestName
      if (input.estimatedValue !== undefined) body.estimatedValue = input.estimatedValue
      if (input.notes) body.notes = input.notes

      const result = await client.post('/registry/gifts', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'create_cash_fund',
    {
      description:
        'Create a new cash fund for the wedding (e.g., honeymoon fund, house down payment). ' +
        'Guests can contribute any amount toward the goal.',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Fund name, e.g. "Honeymoon Fund" (required)'),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe('Description of what the fund is for'),
        goalAmount: z
          .number()
          .min(0)
          .max(1_000_000)
          .optional()
          .describe('Target amount for the fund in dollars'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        name: input.name,
      }
      if (input.description) body.description = input.description
      if (input.goalAmount !== undefined) body.goalAmount = input.goalAmount

      const result = await client.post('/registry/funds', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
