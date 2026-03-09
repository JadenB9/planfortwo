import * as z from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../client.js'

export function registerEventsTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read tools (always registered) ──

  server.registerTool(
    'list_events',
    {
      description:
        'List all wedding events (rehearsal dinner, ceremony, reception, after-party, etc.).',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/events')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_event',
    {
      description: 'Get detailed information about a specific event.',
      inputSchema: z.object({
        eventId: z.string().describe('The event ID to retrieve.'),
      }),
    },
    async ({ eventId }) => {
      const result = await client.get(`/events/${eventId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_timeline',
    {
      description:
        'List all timeline entries for a specific event (e.g. ceremony processional at 2:00 PM, first dance at 7:30 PM).',
      inputSchema: z.object({
        eventId: z.string().describe('The event ID to list timeline entries for.'),
      }),
    },
    async ({ eventId }) => {
      const result = await client.get(`/events/${eventId}/timeline`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Write tools (admin mode only) ──

  if (mode !== 'admin') return

  server.registerTool(
    'create_event',
    {
      description:
        'Create a new wedding event (e.g. rehearsal dinner, ceremony, reception, brunch).',
      inputSchema: z.object({
        name: z.string().describe('Event name (e.g. "Rehearsal Dinner", "Ceremony", "Reception").'),
        date: z
          .string()
          .optional()
          .describe('Event date in ISO 8601 datetime format (e.g. 2026-06-15T00:00:00.000Z).'),
        startTime: z.string().optional().describe('Start time (e.g. "5:00 PM" or "17:00").'),
        endTime: z.string().optional().describe('End time (e.g. "10:00 PM" or "22:00").'),
        venue: z.string().optional().describe('Venue name.'),
        address: z.string().optional().describe('Full address of the venue.'),
        description: z.string().optional().describe('Event description or notes.'),
        dressCode: z.string().optional().describe('Dress code (e.g. "Black Tie", "Cocktail").'),
      }),
    },
    async ({ name, date, startTime, endTime, venue, address, description, dressCode }) => {
      const body: Record<string, unknown> = { name }
      if (date !== undefined) body['date'] = date
      if (startTime !== undefined) body['startTime'] = startTime
      if (endTime !== undefined) body['endTime'] = endTime
      if (venue !== undefined) body['venue'] = venue
      if (address !== undefined) body['address'] = address
      if (description !== undefined) body['description'] = description
      if (dressCode !== undefined) body['dressCode'] = dressCode

      const result = await client.post('/events', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_event',
    {
      description: 'Update an existing wedding event.',
      inputSchema: z.object({
        eventId: z.string().describe('The event ID to update.'),
        name: z.string().optional().describe('Event name.'),
        date: z.string().optional().describe('Event date in ISO 8601 datetime format.'),
        startTime: z.string().optional().describe('Start time.'),
        endTime: z.string().optional().describe('End time.'),
        venue: z.string().optional().describe('Venue name.'),
        address: z.string().optional().describe('Full address.'),
        description: z.string().optional().describe('Event description or notes.'),
        dressCode: z.string().optional().describe('Dress code.'),
      }),
    },
    async ({ eventId, ...fields }) => {
      const body: Record<string, unknown> = {}
      if (fields.name !== undefined) body['name'] = fields.name
      if (fields.date !== undefined) body['date'] = fields.date
      if (fields.startTime !== undefined) body['startTime'] = fields.startTime
      if (fields.endTime !== undefined) body['endTime'] = fields.endTime
      if (fields.venue !== undefined) body['venue'] = fields.venue
      if (fields.address !== undefined) body['address'] = fields.address
      if (fields.description !== undefined) body['description'] = fields.description
      if (fields.dressCode !== undefined) body['dressCode'] = fields.dressCode

      const result = await client.put(`/events/${eventId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'delete_event',
    {
      description: 'Delete a wedding event.',
      inputSchema: z.object({
        eventId: z.string().describe('The event ID to delete.'),
      }),
    },
    async ({ eventId }) => {
      const result = await client.del(`/events/${eventId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_timeline_entry',
    {
      description:
        'Add a timeline entry to an event (e.g. "2:00 PM - Processional", "7:30 PM - First Dance").',
      inputSchema: z.object({
        eventId: z.string().describe('The event ID to add the timeline entry to.'),
        time: z.string().describe('Time for this entry (e.g. "2:00 PM", "19:30").'),
        title: z
          .string()
          .describe('Title of the timeline entry (e.g. "First Dance", "Cake Cutting").'),
        description: z.string().optional().describe('Description or notes for this entry.'),
        responsiblePerson: z
          .string()
          .optional()
          .describe('Person responsible for this timeline item.'),
        location: z.string().optional().describe('Location within the venue.'),
        notes: z.string().optional().describe('Additional notes.'),
      }),
    },
    async ({ eventId, time, title, description, responsiblePerson, location, notes }) => {
      const body: Record<string, unknown> = { eventId, time, title }
      if (description !== undefined) body['description'] = description
      if (responsiblePerson !== undefined) body['responsiblePerson'] = responsiblePerson
      if (location !== undefined) body['location'] = location
      if (notes !== undefined) body['notes'] = notes

      const result = await client.post(`/events/${eventId}/timeline`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
