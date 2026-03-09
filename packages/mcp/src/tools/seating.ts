import * as z from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../client.js'

export function registerSeatingTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read tools (always registered) ──

  server.registerTool(
    'list_seating_charts',
    {
      description: 'List all seating charts for the wedding.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/seating-charts')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_seating_chart',
    {
      description: 'Get a seating chart with all its tables, seat assignments, and venue elements.',
      inputSchema: z.object({
        chartId: z.string().describe('The seating chart ID to retrieve.'),
      }),
    },
    async ({ chartId }) => {
      const result = await client.get(`/seating-charts/${chartId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'check_seating_conflicts',
    {
      description:
        'Check a seating chart for conflicts (over-capacity tables, guests with "keep apart" relationships seated together, unassigned guests, etc.).',
      inputSchema: z.object({
        chartId: z.string().describe('The seating chart ID to check for conflicts.'),
      }),
    },
    async ({ chartId }) => {
      const result = await client.get(`/seating-charts/${chartId}/conflicts`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Write tools (admin mode only) ──

  if (mode !== 'admin') return

  server.registerTool(
    'create_seating_chart',
    {
      description: 'Create a new seating chart for the wedding.',
      inputSchema: z.object({
        name: z.string().describe('Name for the seating chart (e.g. "Reception Seating").'),
        eventName: z.string().optional().describe('Associated event name (e.g. "Reception").'),
      }),
    },
    async ({ name, eventName }) => {
      const body: Record<string, unknown> = { name }
      if (eventName !== undefined) body['eventName'] = eventName

      const result = await client.post('/seating-charts', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_table',
    {
      description:
        'Add a table to a seating chart. Table types: round, rectangular, banquet, head_table, sweetheart.',
      inputSchema: z.object({
        chartId: z.string().describe('The seating chart ID to add the table to.'),
        name: z.string().describe('Table label (e.g. "Table 1", "Head Table", "Family Table").'),
        shape: z
          .enum(['round', 'rectangular', 'banquet', 'head_table', 'sweetheart'])
          .optional()
          .describe('Table shape/type. Defaults to round.'),
        capacity: z.number().optional().describe('Maximum number of seats at this table (1-50).'),
        x: z.number().optional().describe('X position on the canvas.'),
        y: z.number().optional().describe('Y position on the canvas.'),
      }),
    },
    async ({ chartId, name, shape, capacity, x, y }) => {
      const body: Record<string, unknown> = { chartId, label: name }
      if (shape !== undefined) body['tableType'] = shape
      if (capacity !== undefined) body['capacity'] = capacity
      if (x !== undefined) body['posX'] = x
      if (y !== undefined) body['posY'] = y

      const result = await client.post(`/seating-charts/${chartId}/tables`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'assign_seat',
    {
      description: 'Assign a guest to a seat at a table.',
      inputSchema: z.object({
        tableId: z.string().describe('The table ID to assign the guest to.'),
        guestId: z.string().describe('The guest ID to assign.'),
        seatNumber: z
          .number()
          .optional()
          .describe('Specific seat number at the table (starting from 1).'),
      }),
    },
    async ({ tableId, guestId, seatNumber }) => {
      const body: Record<string, unknown> = { tableId, guestId }
      if (seatNumber !== undefined) body['seatNumber'] = seatNumber

      const result = await client.post('/seating-charts/assignments', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'remove_seat_assignment',
    {
      description: 'Remove a guest seat assignment from a table.',
      inputSchema: z.object({
        assignmentId: z.string().describe('The seat assignment ID to remove.'),
      }),
    },
    async ({ assignmentId }) => {
      const result = await client.del(`/seating-charts/assignments/${assignmentId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
