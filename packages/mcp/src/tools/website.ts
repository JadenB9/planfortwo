import * as z from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ApiClient } from '../client.js'

export function registerWebsiteTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read tools (always registered) ──

  server.registerTool(
    'get_website_config',
    {
      description:
        'Get the wedding website configuration including template, subdomain, colors, fonts, and published status.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/website-config')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_website_analytics',
    {
      description: 'Get wedding website visitor analytics (page views, unique visitors, etc.).',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/website-analytics')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_website_sections',
    {
      description:
        'List all website sections (hero, our-story, event-details, gallery, rsvp, etc.) with their content and visibility.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/website-sections')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_guestbook_entries',
    {
      description: 'List all guestbook entries submitted by wedding guests.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/guestbook')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Write tools (admin mode only) ──

  if (mode !== 'admin') return

  server.registerTool(
    'update_website',
    {
      description:
        'Update wedding website configuration (template, subdomain, colors, fonts, meta tags, etc.).',
      inputSchema: z.object({
        configId: z.string().describe('The website config ID to update.'),
        templateId: z.string().optional().describe('Template ID (e.g. classic, modern, rustic).'),
        subdomain: z.string().optional().describe('Subdomain for the wedding website URL.'),
        primaryColor: z.string().optional().describe('Primary color hex code (e.g. #4A90D9).'),
        secondaryColor: z.string().optional().describe('Secondary color hex code (e.g. #F5A623).'),
        fontPair: z
          .string()
          .optional()
          .describe('Font pair name (e.g. playfair-lato, serif-sans).'),
        customCss: z.string().optional().describe('Custom CSS to inject into the website.'),
        metaTitle: z.string().optional().describe('Meta title for SEO.'),
        metaDescription: z.string().optional().describe('Meta description for SEO.'),
        hashtag: z.string().optional().describe('Wedding hashtag.'),
      }),
    },
    async ({ configId, ...fields }) => {
      const body: Record<string, unknown> = {}
      if (fields.templateId !== undefined) body['templateId'] = fields.templateId
      if (fields.subdomain !== undefined) body['subdomain'] = fields.subdomain
      if (fields.fontPair !== undefined) body['fontPair'] = fields.fontPair
      if (fields.metaTitle !== undefined) body['metaTitle'] = fields.metaTitle
      if (fields.metaDescription !== undefined) body['metaDescription'] = fields.metaDescription
      if (fields.hashtag !== undefined) body['hashtag'] = fields.hashtag

      if (fields.primaryColor !== undefined || fields.secondaryColor !== undefined) {
        body['customColors'] = {
          ...(fields.primaryColor ? { primary: fields.primaryColor } : {}),
          ...(fields.secondaryColor ? { secondary: fields.secondaryColor } : {}),
        }
      }

      const result = await client.put(`/website-config/${configId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'publish_website',
    {
      description: 'Publish the wedding website so it is publicly accessible.',
      inputSchema: z.object({
        configId: z.string().describe('The website config ID to publish.'),
      }),
    },
    async ({ configId }) => {
      const result = await client.post(`/website-config/${configId}/publish`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'unpublish_website',
    {
      description: 'Unpublish the wedding website so it is no longer publicly accessible.',
      inputSchema: z.object({
        configId: z.string().describe('The website config ID to unpublish.'),
      }),
    },
    async ({ configId }) => {
      const result = await client.post(`/website-config/${configId}/unpublish`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'update_website_section',
    {
      description:
        'Update a website section content or visibility. Sections include hero, our-story, event-details, wedding-party, gallery, travel, registry, rsvp, schedule, guestbook, custom, etc.',
      inputSchema: z.object({
        sectionId: z.string().describe('The section ID to update.'),
        title: z.string().optional().describe('Section title.'),
        content: z
          .record(z.string(), z.unknown())
          .optional()
          .describe('Section content object (varies by section type).'),
        isVisible: z
          .boolean()
          .optional()
          .describe('Whether the section is visible on the website.'),
      }),
    },
    async ({ sectionId, ...fields }) => {
      const body: Record<string, unknown> = {}
      if (fields.title !== undefined) body['title'] = fields.title
      if (fields.content !== undefined) body['content'] = fields.content
      if (fields.isVisible !== undefined) body['isVisible'] = fields.isVisible

      const result = await client.put(`/website-sections/${sectionId}`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'moderate_guestbook',
    {
      description: 'Approve or reject a guestbook entry.',
      inputSchema: z.object({
        entryId: z.string().describe('The guestbook entry ID to moderate.'),
        approved: z.boolean().describe('Whether to approve (true) or reject (false) the entry.'),
      }),
    },
    async ({ entryId, approved }) => {
      const result = await client.put(`/guestbook/${entryId}/approve`, { approved })
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
