import { eq, and, desc } from 'drizzle-orm'
import { db, emailCampaigns, emailRecipients, announcements } from '@planfortwo/db'
import type {
  CreateEmailCampaignInput,
  UpdateEmailCampaignInput,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '@planfortwo/validators'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'
import { activityService } from './activity.js'

function sanitizeHtml(html: string): string {
  const window = new JSDOM('').window
  const purify = DOMPurify(window)
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'u',
      'em',
      'strong',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'code',
      'div',
      'span',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
      'hr',
      'sub',
      'sup',
      'small',
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'width',
      'height',
      'style',
      'class',
      'id',
      'colspan',
      'rowspan',
    ],
  })
}

export const emailCampaignService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.weddingId, weddingId))
      .orderBy(desc(emailCampaigns.createdAt))
  },

  async getById(campaignId: string, weddingId: string) {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.weddingId, weddingId)))
    return campaign ?? null
  },

  async create(data: CreateEmailCampaignInput, userId: string) {
    const [campaign] = await db
      .insert(emailCampaigns)
      .values({
        weddingId: data.weddingId,
        subject: data.subject,
        body: sanitizeHtml(data.body),
        templateType: data.templateType,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        recipientFilter: data.recipientFilter,
      })
      .returning()

    if (campaign) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'campaign_created',
        entityType: 'email_campaign',
        entityId: campaign.id,
        metadata: { type: 'email_campaign', subject: data.subject },
      })
    }

    return campaign!
  },

  async update(campaignId: string, weddingId: string, data: UpdateEmailCampaignInput) {
    const updateData: Record<string, unknown> = {}
    if (data.subject !== undefined) updateData.subject = data.subject
    if (data.body !== undefined) updateData.body = sanitizeHtml(data.body)
    if (data.templateType !== undefined) updateData.templateType = data.templateType
    if (data.scheduledAt !== undefined)
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null
    if (data.recipientFilter !== undefined) updateData.recipientFilter = data.recipientFilter

    const [updated] = await db
      .update(emailCampaigns)
      .set(updateData)
      .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async delete(campaignId: string, weddingId: string) {
    const [deleted] = await db
      .delete(emailCampaigns)
      .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.weddingId, weddingId)))
      .returning()
    return !!deleted
  },

  async getRecipients(campaignId: string) {
    return db.select().from(emailRecipients).where(eq(emailRecipients.campaignId, campaignId))
  },

  async addRecipient(campaignId: string, email: string, name: string, guestId?: string) {
    const [recipient] = await db
      .insert(emailRecipients)
      .values({ campaignId, email, name, guestId })
      .returning()
    return recipient!
  },

  async trackOpen(recipientId: string) {
    await db
      .update(emailRecipients)
      .set({ openedAt: new Date() })
      .where(eq(emailRecipients.id, recipientId))
  },

  async trackClick(recipientId: string) {
    await db
      .update(emailRecipients)
      .set({ clickedAt: new Date() })
      .where(eq(emailRecipients.id, recipientId))
  },
}

export const announcementService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(announcements)
      .where(eq(announcements.weddingId, weddingId))
      .orderBy(desc(announcements.createdAt))
  },

  async create(data: CreateAnnouncementInput, userId: string) {
    const [announcement] = await db
      .insert(announcements)
      .values({
        weddingId: data.weddingId,
        title: data.title,
        content: sanitizeHtml(data.content),
        isPublished: data.isPublished ?? false,
        publishedAt: data.isPublished ? new Date() : undefined,
      })
      .returning()

    if (announcement) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'announcement_created',
        entityType: 'email_campaign',
        entityId: announcement.id,
        metadata: { type: 'announcement', title: data.title },
      })
    }

    return announcement!
  },

  async update(announcementId: string, weddingId: string, data: UpdateAnnouncementInput) {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = sanitizeHtml(data.content)
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished
      if (data.isPublished) updateData.publishedAt = new Date()
    }

    const [updated] = await db
      .update(announcements)
      .set(updateData)
      .where(and(eq(announcements.id, announcementId), eq(announcements.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async delete(announcementId: string, weddingId: string) {
    const [deleted] = await db
      .delete(announcements)
      .where(and(eq(announcements.id, announcementId), eq(announcements.weddingId, weddingId)))
      .returning()
    return !!deleted
  },
}
