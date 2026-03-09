import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerCommunicationTools(
  server: McpServer,
  client: ApiClient,
  mode: string,
): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'list_emails',
    {
      description:
        'List emails in the wedding inbox. Supports filtering by direction (inbound/outbound), ' +
        'read status, starred status, and free-text search. Returns paginated results.',
      inputSchema: z.object({
        direction: z.enum(['inbound', 'outbound']).optional().describe('Filter by email direction'),
        isRead: z.boolean().optional().describe('Filter by read status'),
        isStarred: z.boolean().optional().describe('Filter by starred status'),
        search: z.string().max(200).optional().describe('Search in subject and body text'),
        page: z.number().int().min(1).optional().describe('Page number (defaults to 1)'),
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Results per page (defaults to 20, max 100)'),
      }),
    },
    async (input) => {
      const query: Record<string, string | number | boolean | undefined> = {}
      if (input.direction) query.direction = input.direction
      if (input.isRead !== undefined) query.isRead = input.isRead
      if (input.isStarred !== undefined) query.isStarred = input.isStarred
      if (input.search) query.search = input.search
      if (input.page !== undefined) query.page = input.page
      if (input.pageSize !== undefined) query.pageSize = input.pageSize

      const result = await client.get('/inbox', query)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_email',
    {
      description:
        'Get full details for a single email including subject, body, sender, recipient, ' +
        'attachments, and read/starred status.',
      inputSchema: z.object({
        emailId: z.string().uuid().describe('The UUID of the email to retrieve'),
      }),
    },
    async (input) => {
      const result = await client.get(`/inbox/${input.emailId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_unread_count',
    {
      description: 'Get the number of unread emails in the inbox.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/inbox/unread-count')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_email_addresses',
    {
      description:
        'List all claimed @planfortwo.com email addresses for the current user. ' +
        'These are the addresses that can be used to send and receive emails.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/inbox/addresses')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_email_campaigns',
    {
      description:
        'List all email campaigns for the wedding. Campaigns are bulk emails sent to guest groups ' +
        '(e.g., save-the-dates, invitations, reminders). Returns campaign subject, status, and template type.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/email-campaigns')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'send_email',
    {
      description:
        'Send an email from a claimed @planfortwo.com address. Requires a valid fromAddressId ' +
        '(use list_email_addresses to get available addresses), recipient address, subject, and body.',
      inputSchema: z.object({
        fromAddressId: z
          .string()
          .uuid()
          .describe(
            'UUID of the claimed email address to send from (required). Use list_email_addresses to find valid IDs',
          ),
        to: z.string().email().describe('Recipient email address (required)'),
        subject: z.string().min(1).max(500).describe('Email subject line (required)'),
        textBody: z.string().min(1).max(50_000).describe('Plain text email body (required)'),
        htmlBody: z
          .string()
          .max(200_000)
          .optional()
          .describe('HTML email body for rich formatting'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        emailAddressId: input.fromAddressId,
        toAddress: input.to,
        subject: input.subject,
        textBody: input.textBody,
      }
      if (input.htmlBody) body.htmlBody = input.htmlBody

      const result = await client.post('/inbox/send', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'mark_email_read',
    {
      description: 'Mark an email as read or unread. Can also toggle the starred status.',
      inputSchema: z.object({
        emailId: z.string().uuid().describe('The UUID of the email to update (required)'),
        isRead: z.boolean().optional().describe('Set read status (true = read, false = unread)'),
        isStarred: z.boolean().optional().describe('Set starred status'),
      }),
    },
    async (input) => {
      const { emailId, ...fields } = input
      const body: Record<string, unknown> = {}
      if (fields.isRead !== undefined) body.isRead = fields.isRead
      if (fields.isStarred !== undefined) body.isStarred = fields.isStarred

      const result = await client.patch(`/inbox/${emailId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'create_email_campaign',
    {
      description:
        'Create a new email campaign to send bulk emails to wedding guests. ' +
        'Campaigns can be save-the-dates, invitations, updates, reminders, thank-yous, or custom templates. ' +
        'Use recipientFilter to target specific guest groups.',
      inputSchema: z.object({
        subject: z.string().min(1).max(500).describe('Email subject line (required)'),
        body: z.string().min(1).max(50_000).describe('Email body content in HTML (required)'),
        templateType: z
          .enum(['save_the_date', 'invitation', 'update', 'reminder', 'thank_you', 'custom'])
          .optional()
          .describe('Campaign template type'),
        scheduledAt: z
          .string()
          .optional()
          .describe('Schedule send time in ISO 8601 datetime format. Omit to save as draft'),
        recipientFilter: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'Filter object to target specific guests. ' +
              'Keys can include rsvpStatus, tags, households, etc.',
          ),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        subject: input.subject,
        body: input.body,
      }
      if (input.templateType) body.templateType = input.templateType
      if (input.scheduledAt) body.scheduledAt = input.scheduledAt
      if (input.recipientFilter) body.recipientFilter = input.recipientFilter

      const result = await client.post('/email-campaigns', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
