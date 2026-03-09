import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerGuestTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read Tools (available in all modes) ──

  server.registerTool(
    'search_guests',
    {
      description:
        'Search and filter the wedding guest list. Supports text search by name, filtering by RSVP status, side (bride/groom/both), tag, and pagination. Returns guest records with contact info, RSVP status, dietary needs, plus-one details, and household assignment.',
      inputSchema: z.object({
        search: z.string().max(200).optional().describe('Search by guest name (first or last)'),
        rsvpStatus: z
          .enum(['pending', 'accepted', 'declined', 'maybe'])
          .optional()
          .describe('Filter by RSVP status'),
        side: z
          .enum(['bride', 'groom', 'both'])
          .optional()
          .describe('Filter by which side of the couple the guest belongs to'),
        tagId: z
          .string()
          .optional()
          .describe('Filter by guest tag ID. Use list_guest_tags to find tag IDs.'),
        householdId: z
          .string()
          .optional()
          .describe('Filter by household/family group ID. Use list_households to find IDs.'),
        isChild: z
          .boolean()
          .optional()
          .describe('Filter for children only (true) or adults only (false)'),
        isVip: z.boolean().optional().describe('Filter for VIP guests only'),
        page: z.number().int().min(1).optional().describe('Page number for pagination (default 1)'),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .describe('Number of guests per page (default 50, max 200)'),
      }),
    },
    async ({ search, rsvpStatus, side, tagId, householdId, isChild, isVip, page, pageSize }) => {
      const query: Record<string, string | number | boolean | undefined> = {}
      if (search !== undefined) query.search = search
      if (rsvpStatus !== undefined) query.rsvpStatus = rsvpStatus
      if (side !== undefined) query.side = side
      if (tagId !== undefined) query.tagId = tagId
      if (householdId !== undefined) query.householdId = householdId
      if (isChild !== undefined) query.isChild = isChild
      if (isVip !== undefined) query.isVip = isVip
      if (page !== undefined) query.page = page
      if (pageSize !== undefined) query.pageSize = pageSize

      const result = await client.get('/guests', query)
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'get_guest_stats',
    {
      description:
        'Get guest list statistics including total count, RSVP breakdown (accepted, declined, pending, maybe), plus-one counts, and dietary summary. Use this for a quick numerical overview of the guest list.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/guests/stats')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'list_households',
    {
      description:
        'List all family/household groups for the wedding. Households group guests who RSVP together (e.g., a married couple, a family). Shows household name, address, and member count.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/households')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'list_guest_tags',
    {
      description:
        'List all guest tags for the wedding. Tags are colored labels used to categorize guests (e.g., "College Friends", "Work", "Family"). Returns tag ID, name, and color.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/guest-tags')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'get_rsvp_dashboard',
    {
      description:
        'Get RSVP dashboard statistics including total guests, adults vs children, plus-one counts, RSVP response breakdown, and dietary requirement summary. More detailed than get_guest_stats for RSVP-specific data.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/rsvp/dashboard')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  server.registerTool(
    'export_guests',
    {
      description:
        'Export the entire guest list as CSV data. Includes all guest fields: name, contact, RSVP status, dietary needs, household, tags, etc. Useful for generating reports or sharing with vendors.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/guests/export')
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // ── Write Tools (admin mode only) ──

  if (mode === 'admin') {
    server.registerTool(
      'add_guest',
      {
        description:
          'Add a new guest to the wedding guest list. Only firstName is required; all other fields are optional. The guest will be created with a unique RSVP token for invitation tracking.',
        inputSchema: z.object({
          firstName: z.string().min(1).max(100).describe('Guest first name (required)'),
          lastName: z.string().min(1).max(100).optional().describe('Guest last name'),
          email: z.string().optional().describe('Guest email address for RSVP invitations'),
          phone: z.string().max(30).optional().describe('Guest phone number'),
          side: z
            .enum(['bride', 'groom', 'both'])
            .optional()
            .describe('Which side of the couple this guest belongs to'),
          rsvpStatus: z
            .enum(['pending', 'accepted', 'declined', 'maybe'])
            .optional()
            .describe('Initial RSVP status (default "pending")'),
          isChild: z.boolean().optional().describe('Whether this guest is a child (default false)'),
          age: z
            .number()
            .int()
            .min(0)
            .max(120)
            .optional()
            .describe('Guest age (relevant for children)'),
          isVip: z.boolean().optional().describe('Mark as VIP guest (default false)'),
          hasPlusOne: z
            .boolean()
            .optional()
            .describe('Whether the guest is allowed a plus-one (default false)'),
          plusOneName: z.string().max(200).optional().describe('Name of the plus-one if known'),
          householdId: z
            .string()
            .optional()
            .describe(
              'Household/family group ID to assign this guest to. Use list_households to find IDs, or create_household to make a new one.',
            ),
          notes: z.string().max(2000).optional().describe('Private notes about this guest'),
          dietaryNotes: z
            .string()
            .max(500)
            .optional()
            .describe('Dietary restrictions or allergies as free text'),
        }),
      },
      async ({
        firstName,
        lastName,
        email,
        phone,
        side,
        rsvpStatus,
        isChild,
        age,
        isVip,
        hasPlusOne,
        plusOneName,
        householdId,
        notes,
        dietaryNotes,
      }) => {
        const body: Record<string, unknown> = { firstName }
        if (lastName !== undefined) body.lastName = lastName
        if (email !== undefined) body.email = email
        if (phone !== undefined) body.phone = phone
        if (side !== undefined) body.side = side
        if (rsvpStatus !== undefined) body.rsvpStatus = rsvpStatus
        if (isChild !== undefined) body.isChild = isChild
        if (age !== undefined) body.age = age
        if (isVip !== undefined) body.isVip = isVip
        if (hasPlusOne !== undefined) body.hasPlusOne = hasPlusOne
        if (plusOneName !== undefined) body.plusOneName = plusOneName
        if (householdId !== undefined) body.householdId = householdId
        if (notes !== undefined) body.rsvpNotes = notes
        if (dietaryNotes !== undefined) {
          body.dietary = { notes: dietaryNotes }
        }

        const result = await client.post('/guests', body)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'update_guest',
      {
        description:
          "Update an existing guest's information. Only include the fields you want to change; omitted fields remain unchanged. Use search_guests to find the guest ID first.",
        inputSchema: z.object({
          guestId: z.string().describe('The guest ID to update. Use search_guests to find this.'),
          firstName: z.string().min(1).max(100).optional().describe('Updated first name'),
          lastName: z.string().min(1).max(100).optional().describe('Updated last name'),
          email: z.string().optional().describe('Updated email address'),
          phone: z.string().max(30).optional().describe('Updated phone number'),
          side: z.enum(['bride', 'groom', 'both']).optional().describe('Updated side assignment'),
          rsvpStatus: z
            .enum(['pending', 'accepted', 'declined', 'maybe'])
            .optional()
            .describe('Updated RSVP status'),
          isChild: z.boolean().optional().describe('Whether this guest is a child'),
          age: z.number().int().min(0).max(120).optional().describe('Updated age'),
          isVip: z.boolean().optional().describe('Updated VIP status'),
          hasPlusOne: z.boolean().optional().describe('Whether the guest has a plus-one'),
          plusOneName: z.string().max(200).optional().describe('Updated plus-one name'),
          householdId: z.string().optional().describe('Updated household/family group ID'),
          notes: z.string().max(2000).optional().describe('Updated private notes'),
          dietaryNotes: z.string().max(500).optional().describe('Updated dietary notes'),
        }),
      },
      async ({
        guestId,
        firstName,
        lastName,
        email,
        phone,
        side,
        rsvpStatus,
        isChild,
        age,
        isVip,
        hasPlusOne,
        plusOneName,
        householdId,
        notes,
        dietaryNotes,
      }) => {
        const body: Record<string, unknown> = {}
        if (firstName !== undefined) body.firstName = firstName
        if (lastName !== undefined) body.lastName = lastName
        if (email !== undefined) body.email = email
        if (phone !== undefined) body.phone = phone
        if (side !== undefined) body.side = side
        if (rsvpStatus !== undefined) body.rsvpStatus = rsvpStatus
        if (isChild !== undefined) body.isChild = isChild
        if (age !== undefined) body.age = age
        if (isVip !== undefined) body.isVip = isVip
        if (hasPlusOne !== undefined) body.hasPlusOne = hasPlusOne
        if (plusOneName !== undefined) body.plusOneName = plusOneName
        if (householdId !== undefined) body.householdId = householdId
        if (notes !== undefined) body.rsvpNotes = notes
        if (dietaryNotes !== undefined) {
          body.dietary = { notes: dietaryNotes }
        }

        const result = await client.put(`/guests/${guestId}`, body)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'delete_guest',
      {
        description:
          'Permanently delete a guest from the guest list. This cannot be undone. Use search_guests to find the guest ID first.',
        inputSchema: z.object({
          guestId: z.string().describe('The guest ID to delete. Use search_guests to find this.'),
        }),
      },
      async ({ guestId }) => {
        const result = await client.del(`/guests/${guestId}`)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'create_household',
      {
        description:
          'Create a new family/household group. Households group guests who RSVP together. After creating, assign guests to it using add_guest or update_guest with the returned householdId.',
        inputSchema: z.object({
          name: z
            .string()
            .min(1)
            .max(200)
            .describe('Household name (e.g., "The Smith Family", "Johnson Household")'),
        }),
      },
      async ({ name }) => {
        const result = await client.post('/households', { name })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'create_guest_tag',
      {
        description:
          'Create a new guest tag for categorizing guests. Tags have a name and hex color. Examples: "College Friends" (#3B82F6), "Family" (#EF4444), "Work" (#10B981).',
        inputSchema: z.object({
          name: z
            .string()
            .min(1)
            .max(100)
            .describe('Tag name (e.g., "College Friends", "VIP", "Family")'),
          color: z
            .string()
            .describe('Hex color code for the tag (e.g., "#3B82F6" for blue, "#EF4444" for red)'),
        }),
      },
      async ({ name, color }) => {
        const result = await client.post('/guest-tags', { name, color })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'assign_guest_tags',
      {
        description:
          'Assign one or more tags to a guest. This replaces any existing tag assignments for the guest. Use list_guest_tags to find tag IDs and search_guests to find the guest ID.',
        inputSchema: z.object({
          guestId: z
            .string()
            .describe('The guest ID to assign tags to. Use search_guests to find this.'),
          tagIds: z
            .array(z.string())
            .min(1)
            .max(20)
            .describe('Array of tag IDs to assign. Use list_guest_tags to find valid IDs.'),
        }),
      },
      async ({ guestId, tagIds }) => {
        const result = await client.post(`/guests/${guestId}/tags`, { tagIds })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )

    server.registerTool(
      'send_rsvp_invites',
      {
        description:
          'Send RSVP invitation emails to guests. If guestIds is provided, sends only to those specific guests. If omitted, sends to all guests who have an email address and have not yet been invited. Each guest receives a unique RSVP link.',
        inputSchema: z.object({
          guestIds: z
            .array(z.string())
            .min(1)
            .max(200)
            .optional()
            .describe(
              'Specific guest IDs to send invites to. Omit to send to all uninvited guests with email addresses.',
            ),
        }),
      },
      async ({ guestIds }) => {
        const body: Record<string, unknown> = {}
        if (guestIds !== undefined) body.guestIds = guestIds

        const result = await client.post('/guests/send-invites', body)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      },
    )
  }
}
