import { eq, and, or } from 'drizzle-orm'
import { db, websiteConfigs, websiteSections, defaultWebsiteSections } from '@planfortwo/db'
import type { CreateWebsiteConfigInput, UpdateWebsiteConfigInput } from '@planfortwo/validators'
import { hash, compare } from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { activityService } from './activity.js'

function stripSensitiveFields<T extends { passwordHash?: string | null }>(
  config: T,
): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...safe } = config
  return safe
}

export const websiteConfigService = {
  async get(weddingId: string) {
    const [config] = await db
      .select()
      .from(websiteConfigs)
      .where(eq(websiteConfigs.weddingId, weddingId))

    return config ? stripSensitiveFields(config) : null
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
        accessToken: randomBytes(16).toString('hex'),
      })
      .returning()

    // Seed default sections
    const sectionValues = defaultWebsiteSections.map((s) => ({
      weddingId: data.weddingId,
      sectionType: s.sectionType as
        | 'hero'
        | 'our_story'
        | 'event_details'
        | 'wedding_party'
        | 'gallery'
        | 'travel'
        | 'things_to_do'
        | 'registry'
        | 'faq'
        | 'rsvp'
        | 'schedule'
        | 'guestbook'
        | 'custom'
        | 'song_requests',
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

    return stripSensitiveFields(config!)
  },

  async update(id: string, weddingId: string, data: UpdateWebsiteConfigInput) {
    const updateData: Record<string, unknown> = {}

    if (data.templateId !== undefined) updateData.templateId = data.templateId
    if (data.customColors !== undefined) updateData.customColors = data.customColors
    if (data.savedPalettes !== undefined) updateData.savedPalettes = data.savedPalettes
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

    return updated ? stripSensitiveFields(updated) : null
  },

  async publish(id: string, weddingId: string, userId: string) {
    // Ensure accessToken exists before publishing
    const [existing] = await db
      .select({ accessToken: websiteConfigs.accessToken })
      .from(websiteConfigs)
      .where(and(eq(websiteConfigs.id, id), eq(websiteConfigs.weddingId, weddingId)))

    const setData: Record<string, unknown> = { publishedAt: new Date() }
    if (!existing?.accessToken) {
      setData.accessToken = randomBytes(16).toString('hex')
    }

    const [updated] = await db
      .update(websiteConfigs)
      .set(setData)
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

    return updated ? stripSensitiveFields(updated) : null
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

    return updated ? stripSensitiveFields(updated) : null
  },

  async setPassword(id: string, weddingId: string, password: string) {
    const passwordHash = await hash(password, 12)
    const [updated] = await db
      .update(websiteConfigs)
      .set({ passwordHash, privacyMode: 'password' })
      .where(and(eq(websiteConfigs.id, id), eq(websiteConfigs.weddingId, weddingId)))
      .returning()

    return updated ? stripSensitiveFields(updated) : null
  },

  async verifyPassword(accessToken: string, password: string): Promise<boolean> {
    // Support both access token and subdomain lookups
    const tokenMatch = accessToken.match(/([0-9a-f]{32})$/)
    const token = tokenMatch?.[1]
    const conditions = []
    if (token) conditions.push(eq(websiteConfigs.accessToken, token))
    conditions.push(eq(websiteConfigs.subdomain, accessToken))

    const [config] = await db
      .select({ passwordHash: websiteConfigs.passwordHash })
      .from(websiteConfigs)
      .where(or(...conditions))

    if (!config?.passwordHash) return false
    return compare(password, config.passwordHash)
  },

  async checkSubdomain(subdomain: string, excludeWeddingId?: string): Promise<boolean> {
    const [existing] = await db
      .select({ id: websiteConfigs.id, weddingId: websiteConfigs.weddingId })
      .from(websiteConfigs)
      .where(eq(websiteConfigs.subdomain, subdomain))

    if (!existing) return true
    if (excludeWeddingId && existing.weddingId === excludeWeddingId) return true
    return false
  },
}
