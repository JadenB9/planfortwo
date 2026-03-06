import { eq, count, isNotNull, and } from 'drizzle-orm'
import { db } from '@planfortwo/db'
import {
  checklistTasks,
  guests,
  budgetCategories,
  budgetItems,
  websiteConfigs,
  seatingCharts,
  vendors,
  events,
  photos,
  registryLinks,
  cashFunds,
  ceremonyOutlines,
  playlists,
  honeymoonPlans,
  emailCampaigns,
  roadmapPreferences,
} from '@planfortwo/db/schema'
import type {
  FeatureProgress,
  FeatureStatus,
  PlanningProgress,
  RoadmapPreferences,
} from '@planfortwo/types'

function deriveStatus(progress: number): FeatureStatus {
  if (progress >= 100) return 'completed'
  if (progress > 0) return 'in_progress'
  return 'not_started'
}

export const progressService = {
  async getPreferences(weddingId: string): Promise<RoadmapPreferences | null> {
    const rows = await db
      .select({ overrides: roadmapPreferences.overrides, hidden: roadmapPreferences.hidden })
      .from(roadmapPreferences)
      .where(eq(roadmapPreferences.weddingId, weddingId))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    return {
      overrides: (row.overrides ?? {}) as Record<string, number>,
      hidden: (row.hidden ?? []) as string[],
    }
  },

  async upsertPreferences(
    weddingId: string,
    data: { overrides?: Record<string, number>; hidden?: string[] },
  ): Promise<RoadmapPreferences> {
    const existing = await db
      .select({ id: roadmapPreferences.id })
      .from(roadmapPreferences)
      .where(eq(roadmapPreferences.weddingId, weddingId))
      .limit(1)

    const updateValues: Record<string, unknown> = { updatedAt: new Date() }
    if (data.overrides !== undefined) updateValues.overrides = data.overrides
    if (data.hidden !== undefined) updateValues.hidden = data.hidden

    if (existing.length > 0) {
      await db
        .update(roadmapPreferences)
        .set(updateValues)
        .where(eq(roadmapPreferences.weddingId, weddingId))
    } else {
      await db.insert(roadmapPreferences).values({
        weddingId,
        overrides: data.overrides ?? {},
        hidden: data.hidden ?? [],
      })
    }

    return (await this.getPreferences(weddingId))!
  },

  async getProgress(weddingId: string): Promise<PlanningProgress> {
    const [results, prefs] = await Promise.all([
      Promise.allSettled([
        db
          .select({ value: count() })
          .from(checklistTasks)
          .where(eq(checklistTasks.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(checklistTasks)
          .where(
            and(eq(checklistTasks.weddingId, weddingId), isNotNull(checklistTasks.completedAt)),
          ),
        db.select({ value: count() }).from(guests).where(eq(guests.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(guests)
          .where(and(eq(guests.weddingId, weddingId), isNotNull(guests.rsvpRespondedAt))),
        db
          .select({ value: count() })
          .from(budgetCategories)
          .where(eq(budgetCategories.weddingId, weddingId)),
        db.select({ value: count() }).from(budgetItems).where(eq(budgetItems.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(budgetItems)
          .where(and(eq(budgetItems.weddingId, weddingId), eq(budgetItems.paymentStatus, 'paid'))),
        db.select().from(websiteConfigs).where(eq(websiteConfigs.weddingId, weddingId)).limit(1),
        db
          .select({ value: count() })
          .from(seatingCharts)
          .where(eq(seatingCharts.weddingId, weddingId)),
        db.select({ value: count() }).from(vendors).where(eq(vendors.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(vendors)
          .where(and(eq(vendors.weddingId, weddingId), eq(vendors.status, 'booked'))),
        db.select({ value: count() }).from(events).where(eq(events.weddingId, weddingId)),
        db.select({ value: count() }).from(photos).where(eq(photos.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(registryLinks)
          .where(eq(registryLinks.weddingId, weddingId)),
        db.select({ value: count() }).from(cashFunds).where(eq(cashFunds.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(ceremonyOutlines)
          .where(eq(ceremonyOutlines.weddingId, weddingId)),
        db.select({ value: count() }).from(playlists).where(eq(playlists.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(honeymoonPlans)
          .where(eq(honeymoonPlans.weddingId, weddingId)),
        db
          .select({ value: count() })
          .from(emailCampaigns)
          .where(eq(emailCampaigns.weddingId, weddingId)),
      ]),
      this.getPreferences(weddingId),
    ])

    const cnt = (i: number): number => {
      const r = results[i]
      if (!r || r.status !== 'fulfilled') return 0
      return (r.value as { value: number }[])[0]?.value ?? 0
    }

    const overrides = prefs?.overrides ?? {}
    const hiddenKeys = prefs?.hidden ?? []

    const totalTasks = cnt(0)
    const completedTasks = cnt(1)
    const checklistAutoProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const guestCount = cnt(2)
    const rsvpCount = cnt(3)
    let guestAutoProgress = 0
    if (guestCount > 0) guestAutoProgress += 50
    if (rsvpCount > 0) guestAutoProgress += 50

    const budgetCatCount = cnt(4)
    const budgetItemCount = cnt(5)
    const budgetPaidCount = cnt(6)
    let budgetAutoProgress = 0
    if (budgetCatCount > 0) budgetAutoProgress += 25
    if (budgetItemCount > 0) budgetAutoProgress += 25
    if (budgetPaidCount > 0) budgetAutoProgress += 50

    const websiteSettled = results[7]
    const websiteConfig =
      websiteSettled.status === 'fulfilled'
        ? ((websiteSettled.value as Array<Record<string, unknown>>)[0] ?? null)
        : null
    let websiteAutoProgress = 0
    if (websiteConfig && websiteConfig.publishedAt) websiteAutoProgress = 100
    else if (websiteConfig) websiteAutoProgress = 50

    const seatingCount = cnt(8)
    const seatingAutoProgress = seatingCount > 0 ? 50 : 0

    const vendorCount = cnt(9)
    const vendorBookedCount = cnt(10)
    let vendorAutoProgress = 0
    if (vendorCount > 0) vendorAutoProgress += 50
    if (vendorBookedCount > 0) vendorAutoProgress += 50

    const eventCount = cnt(11)
    const eventAutoProgress = eventCount > 0 ? 50 : 0

    const photoCount = cnt(12)
    const photoAutoProgress = photoCount > 0 ? 50 : 0

    const registryLinkCount = cnt(13)
    const cashFundCount = cnt(14)
    const registryTotal = registryLinkCount + cashFundCount
    let registryAutoProgress = 0
    if (registryLinkCount > 0) registryAutoProgress += 50
    if (cashFundCount > 0) registryAutoProgress += 50

    const ceremonyCount = cnt(15)
    const ceremonyAutoProgress = ceremonyCount > 0 ? 50 : 0

    const playlistCount = cnt(16)
    const playlistAutoProgress = playlistCount > 0 ? 50 : 0

    const honeymoonCount = cnt(17)
    const honeymoonAutoProgress = honeymoonCount > 0 ? 50 : 0

    const emailCount = cnt(18)
    const emailAutoProgress = emailCount > 0 ? 50 : 0

    function makeFeature(
      key: string,
      label: string,
      href: string,
      autoProgress: number,
      itemCount: number,
      description: string,
    ): FeatureProgress {
      const effectiveProgress = overrides[key] !== undefined ? overrides[key] : autoProgress
      return {
        key,
        label,
        href,
        autoProgress,
        progress: effectiveProgress,
        status: deriveStatus(effectiveProgress),
        itemCount,
        description,
        isHidden: hiddenKeys.includes(key),
      }
    }

    const features: FeatureProgress[] = [
      makeFeature(
        'checklist',
        'Checklist',
        '/checklist',
        checklistAutoProgress,
        totalTasks,
        totalTasks > 0
          ? `${completedTasks} of ${totalTasks} tasks completed`
          : 'No tasks created yet',
      ),
      makeFeature(
        'guests',
        'Guest List',
        '/guests',
        guestAutoProgress,
        guestCount,
        guestCount > 0 ? `${guestCount} guests, ${rsvpCount} responded` : 'No guests added yet',
      ),
      makeFeature(
        'budget',
        'Budget',
        '/budget',
        budgetAutoProgress,
        budgetItemCount,
        budgetItemCount > 0 ? `${budgetItemCount} expenses tracked` : 'No budget items yet',
      ),
      makeFeature(
        'website',
        'Website',
        '/website',
        websiteAutoProgress,
        websiteConfig ? 1 : 0,
        websiteConfig
          ? websiteConfig.publishedAt
            ? 'Website published'
            : 'Website in progress'
          : 'No website created yet',
      ),
      makeFeature(
        'seating',
        'Seating Chart',
        '/seating',
        seatingAutoProgress,
        seatingCount,
        seatingCount > 0 ? `${seatingCount} seating chart(s)` : 'No seating charts yet',
      ),
      makeFeature(
        'vendors',
        'Vendors',
        '/vendors',
        vendorAutoProgress,
        vendorCount,
        vendorCount > 0
          ? `${vendorCount} vendors, ${vendorBookedCount} booked`
          : 'No vendors added yet',
      ),
      makeFeature(
        'events',
        'Events',
        '/events',
        eventAutoProgress,
        eventCount,
        eventCount > 0 ? `${eventCount} event(s) planned` : 'No events created yet',
      ),
      makeFeature(
        'photos',
        'Photos',
        '/photos',
        photoAutoProgress,
        photoCount,
        photoCount > 0 ? `${photoCount} photo(s) uploaded` : 'No photos uploaded yet',
      ),
      makeFeature(
        'registry',
        'Registry',
        '/registry',
        registryAutoProgress,
        registryTotal,
        registryTotal > 0
          ? `${registryLinkCount} link(s), ${cashFundCount} fund(s)`
          : 'No registry items yet',
      ),
      makeFeature(
        'ceremony',
        'Ceremony',
        '/ceremony',
        ceremonyAutoProgress,
        ceremonyCount,
        ceremonyCount > 0 ? `${ceremonyCount} outline item(s)` : 'No ceremony outline yet',
      ),
      makeFeature(
        'music',
        'Music',
        '/music',
        playlistAutoProgress,
        playlistCount,
        playlistCount > 0 ? `${playlistCount} playlist(s) created` : 'No playlists yet',
      ),
      makeFeature(
        'honeymoon',
        'Honeymoon',
        '/honeymoon',
        honeymoonAutoProgress,
        honeymoonCount,
        honeymoonCount > 0 ? `${honeymoonCount} plan(s) created` : 'No honeymoon plans yet',
      ),
      makeFeature(
        'communication',
        'Communication',
        '/communication',
        emailAutoProgress,
        emailCount,
        emailCount > 0 ? `${emailCount} campaign(s)` : 'No email campaigns yet',
      ),
    ]

    const visibleFeatures = features.filter((f) => !f.isHidden)
    const overallProgress =
      visibleFeatures.length > 0
        ? Math.round(
            visibleFeatures.reduce((sum, f) => sum + f.progress, 0) / visibleFeatures.length,
          )
        : 0

    return { features, overallProgress, preferences: prefs }
  },
}
