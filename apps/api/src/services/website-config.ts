import { eq, and } from 'drizzle-orm'
import { db, websiteConfigs, websiteSections, defaultWebsiteSections } from '@planfortwo/db'
import type { CreateWebsiteConfigInput, UpdateWebsiteConfigInput } from '@planfortwo/validators'
import { hash, compare } from 'bcryptjs'
import { activityService } from './activity.js'

export const websiteConfigService = {
  async get(weddingId: string) {
    const [config] = await db
      .select()
      .from(websiteConfigs)
      .where(eq(websiteConfigs.weddingId, weddingId))

    return config ?? null
  },

  async create(data: CreateWebsiteConfigInput, userId: string) {
    const existing = await this.get(data.weddingId)
    if (existing) throw new Error('Website config already exists for this wedding')

    const [config] = await db
      .insert(websiteConfigs)
      .values({
        weddingId: data.weddingId,
        templateId: data.templateId,
        subdomain: data.subdomain,
      })
      .returning()

    // Seed default sections
    const sectionValues = defaultWebsiteSections.map((s) => ({
      weddingId: data.weddingId,
      sectionType: s.sectionType as 'hero' | 'our_story' | 'event_details' | 'wedding_party' | 'gallery' | 'travel' | 'things_to_do' | 'registry' | 'faq' | 'rsvp' | 'schedule' | 'guestbook' | 'custom',
      title: s.title,
      content: s.content,
      isVisible: s.isVisible,
      sortOrder: s.sortOrder,
    }))

    await db.insert(websiteSections).values(sectionValues)

    await activityService.log({
      weddingId: data.weddingId,
      userId,
      action: 'website_created',
      entityType: 'website',
      entityId: config!.id,
      metadata: { templateId: data.templateId, subdomain: data.subdomain },
    })

    return config!
  },

  async update(id: string, weddingId: string, data: UpdateWebsiteConfigInput) {
    const updateData: Record<string, unknown> = {}

    if (data.templateId !== undefined) updateData.templateId = data.templateId
    if (data.customColors !== undefined) updateData.customColors = data.customColors
    if (data.fontPair !== undefined) updateData.fontPair = data.fontPair
    if (data.privacyMode !== undefined) updateData.privacyMode = data.privacyMode
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain
    if (data.customDomain !== undefined) updateData.customDomain = data.customDomain
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
    if (data.ogImageUrl !== undefined) updateData.ogImageUrl = data.ogImageUrl
    if (data.hashtag !== undefined) updateData.hashtag = data.hashtag

    if (Object.keys(updateData).length === 0) return null

    const [updated] = await db
      .update(websiteConfigs)
      .set(updateData)
      .where(and(eq(websiteConfigs.id, id), eq(websiteConfigs.weddingId, weddingId)))
      .returning()

    return updated ?? null
  },

  async publish(id: string, weddingId: string, userId: string) {
    const [updated] = await db
      .update(websiteConfigs)
      .set({ publishedAt: new Date() })
      .where(and(eq(websiteConfigs.id, id), eq(websiteConfigs.weddingId, weddingId)))
      .returning()

    if (updated) {
      await activityService.log({
        weddingId,
        userId,
        action: 'website_published',
        entityType: 'website',
        entityId: id,
      })
    }

    return updated ?? null
  },

  async unpublish(id: string, weddingId: string, userId: string) {
    const [updated] = await db
      .update(websiteConfigs)
      .set({ publishedAt: null })
      .where(and(eq(websiteConfigs.id, id), eq(websiteConfigs.weddingId, weddingId)))
      .returning()

    if (updated) {
      await activityService.log({
        weddingId,
        userId,
        action: 'website_unpublished',
        entityType: 'website',
        entityId: id,
      })
    }

    return updated ?? null
  },

  async setPassword(id: string, weddingId: string, password: string) {
    const passwordHash = await hash(password, 12)
    const [updated] = await db
      .update(websiteConfigs)
      .set({ passwordHash, privacyMode: 'password' })
      .where(and(eq(websiteConfigs.id, id), eq(websiteConfigs.weddingId, weddingId)))
      .returning()

    return updated ?? null
  },

  async verifyPassword(subdomain: string, password: string): Promise<boolean> {
    const [config] = await db
      .select({ passwordHash: websiteConfigs.passwordHash })
      .from(websiteConfigs)
      .where(eq(websiteConfigs.subdomain, subdomain))

    if (!config?.passwordHash) return false
    return compare(password, config.passwordHash)
  },

  async checkSubdomain(subdomain: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: websiteConfigs.id })
      .from(websiteConfigs)
      .where(eq(websiteConfigs.subdomain, subdomain))

    return !existing
  },
}
