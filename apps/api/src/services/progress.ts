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
} from '@planfortwo/db/schema'
import type { FeatureProgress, FeatureStatus, PlanningProgress } from '@planfortwo/types'

function deriveStatus(itemCount: number, progress: number): FeatureStatus {
  if (progress >= 100) return 'completed'
  if (itemCount > 0 || progress > 0) return 'in_progress'
  return 'not_started'
}

export const progressService = {
  async getProgress(weddingId: string): Promise<PlanningProgress> {
    const [
      checklistResult,
      checklistCompletedResult,
      guestResult,
      guestRsvpResult,
      budgetCatResult,
      budgetItemResult,
      budgetPaidResult,
      websiteResult,
      seatingResult,
      vendorResult,
      vendorBookedResult,
      eventResult,
      photoResult,
      registryLinkResult,
      cashFundResult,
      ceremonyResult,
      playlistResult,
      honeymoonResult,
      emailResult,
    ] = await Promise.all([
      db.select({ value: count() }).from(checklistTasks).where(eq(checklistTasks.weddingId, weddingId)),
      db.select({ value: count() }).from(checklistTasks).where(and(eq(checklistTasks.weddingId, weddingId), isNotNull(checklistTasks.completedAt))),
      db.select({ value: count() }).from(guests).where(eq(guests.weddingId, weddingId)),
      db.select({ value: count() }).from(guests).where(and(eq(guests.weddingId, weddingId), isNotNull(guests.rsvpRespondedAt))),
      db.select({ value: count() }).from(budgetCategories).where(eq(budgetCategories.weddingId, weddingId)),
      db.select({ value: count() }).from(budgetItems).where(eq(budgetItems.weddingId, weddingId)),
      db.select({ value: count() }).from(budgetItems).where(and(eq(budgetItems.weddingId, weddingId), eq(budgetItems.paymentStatus, 'paid'))),
      db.select().from(websiteConfigs).where(eq(websiteConfigs.weddingId, weddingId)).limit(1),
      db.select({ value: count() }).from(seatingCharts).where(eq(seatingCharts.weddingId, weddingId)),
      db.select({ value: count() }).from(vendors).where(eq(vendors.weddingId, weddingId)),
      db.select({ value: count() }).from(vendors).where(and(eq(vendors.weddingId, weddingId), eq(vendors.status, 'booked'))),
      db.select({ value: count() }).from(events).where(eq(events.weddingId, weddingId)),
      db.select({ value: count() }).from(photos).where(eq(photos.weddingId, weddingId)),
      db.select({ value: count() }).from(registryLinks).where(eq(registryLinks.weddingId, weddingId)),
      db.select({ value: count() }).from(cashFunds).where(eq(cashFunds.weddingId, weddingId)),
      db.select({ value: count() }).from(ceremonyOutlines).where(eq(ceremonyOutlines.weddingId, weddingId)),
      db.select({ value: count() }).from(playlists).where(eq(playlists.weddingId, weddingId)),
      db.select({ value: count() }).from(honeymoonPlans).where(eq(honeymoonPlans.weddingId, weddingId)),
      db.select({ value: count() }).from(emailCampaigns).where(eq(emailCampaigns.weddingId, weddingId)),
    ])

    const totalTasks = checklistResult[0]?.value ?? 0
    const completedTasks = checklistCompletedResult[0]?.value ?? 0
    const checklistProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const guestCount = guestResult[0]?.value ?? 0
    const rsvpCount = guestRsvpResult[0]?.value ?? 0
    let guestProgress = 0
    if (guestCount > 0) guestProgress += 50
    if (rsvpCount > 0) guestProgress += 50

    const budgetCatCount = budgetCatResult[0]?.value ?? 0
    const budgetItemCount = budgetItemResult[0]?.value ?? 0
    const budgetPaidCount = budgetPaidResult[0]?.value ?? 0
    let budgetProgress = 0
    if (budgetCatCount > 0) budgetProgress += 25
    if (budgetItemCount > 0) budgetProgress += 25
    if (budgetPaidCount > 0) budgetProgress += 50

    const websiteConfig = websiteResult[0] ?? null
    let websiteProgress = 0
    if (websiteConfig && websiteConfig.publishedAt) websiteProgress = 100
    else if (websiteConfig) websiteProgress = 50

    const seatingCount = seatingResult[0]?.value ?? 0
    const seatingProgress = seatingCount > 0 ? 50 : 0

    const vendorCount = vendorResult[0]?.value ?? 0
    const vendorBookedCount = vendorBookedResult[0]?.value ?? 0
    let vendorProgress = 0
    if (vendorCount > 0) vendorProgress += 50
    if (vendorBookedCount > 0) vendorProgress += 50

    const eventCount = eventResult[0]?.value ?? 0
    const eventProgress = eventCount > 0 ? 50 : 0

    const photoCount = photoResult[0]?.value ?? 0
    const photoProgress = photoCount > 0 ? 50 : 0

    const registryLinkCount = registryLinkResult[0]?.value ?? 0
    const cashFundCount = cashFundResult[0]?.value ?? 0
    const registryTotal = registryLinkCount + cashFundCount
    let registryProgress = 0
    if (registryLinkCount > 0) registryProgress += 50
    if (cashFundCount > 0) registryProgress += 50

    const ceremonyCount = ceremonyResult[0]?.value ?? 0
    const ceremonyProgress = ceremonyCount > 0 ? 50 : 0

    const playlistCount = playlistResult[0]?.value ?? 0
    const playlistProgress = playlistCount > 0 ? 50 : 0

    const honeymoonCount = honeymoonResult[0]?.value ?? 0
    const honeymoonProgress = honeymoonCount > 0 ? 50 : 0

    const emailCount = emailResult[0]?.value ?? 0
    const emailProgress = emailCount > 0 ? 50 : 0

    const features: FeatureProgress[] = [
      {
        key: 'checklist',
        label: 'Checklist',
        href: '/dashboard/checklist',
        status: deriveStatus(totalTasks, checklistProgress),
        progress: checklistProgress,
        itemCount: totalTasks,
        description: totalTasks > 0 ? `${completedTasks} of ${totalTasks} tasks completed` : 'No tasks created yet',
      },
      {
        key: 'guests',
        label: 'Guest List',
        href: '/dashboard/guests',
        status: deriveStatus(guestCount, guestProgress),
        progress: guestProgress,
        itemCount: guestCount,
        description: guestCount > 0 ? `${guestCount} guests, ${rsvpCount} responded` : 'No guests added yet',
      },
      {
        key: 'budget',
        label: 'Budget',
        href: '/dashboard/budget',
        status: deriveStatus(budgetCatCount + budgetItemCount, budgetProgress),
        progress: budgetProgress,
        itemCount: budgetItemCount,
        description: budgetItemCount > 0 ? `${budgetItemCount} expenses tracked` : 'No budget items yet',
      },
      {
        key: 'website',
        label: 'Website',
        href: '/dashboard/website',
        status: websiteConfig ? (websiteConfig.publishedAt ? 'completed' : 'in_progress') : 'not_started',
        progress: websiteProgress,
        itemCount: websiteConfig ? 1 : 0,
        description: websiteConfig ? (websiteConfig.publishedAt ? 'Website published' : 'Website in progress') : 'No website created yet',
      },
      {
        key: 'seating',
        label: 'Seating Chart',
        href: '/dashboard/seating',
        status: deriveStatus(seatingCount, seatingProgress),
        progress: seatingProgress,
        itemCount: seatingCount,
        description: seatingCount > 0 ? `${seatingCount} seating chart(s)` : 'No seating charts yet',
      },
      {
        key: 'vendors',
        label: 'Vendors',
        href: '/dashboard/vendors',
        status: deriveStatus(vendorCount, vendorProgress),
        progress: vendorProgress,
        itemCount: vendorCount,
        description: vendorCount > 0 ? `${vendorCount} vendors, ${vendorBookedCount} booked` : 'No vendors added yet',
      },
      {
        key: 'events',
        label: 'Events',
        href: '/dashboard/events',
        status: deriveStatus(eventCount, eventProgress),
        progress: eventProgress,
        itemCount: eventCount,
        description: eventCount > 0 ? `${eventCount} event(s) planned` : 'No events created yet',
      },
      {
        key: 'photos',
        label: 'Photos',
        href: '/dashboard/photos',
        status: deriveStatus(photoCount, photoProgress),
        progress: photoProgress,
        itemCount: photoCount,
        description: photoCount > 0 ? `${photoCount} photo(s) uploaded` : 'No photos uploaded yet',
      },
      {
        key: 'registry',
        label: 'Registry',
        href: '/dashboard/registry',
        status: deriveStatus(registryTotal, registryProgress),
        progress: registryProgress,
        itemCount: registryTotal,
        description: registryTotal > 0 ? `${registryLinkCount} link(s), ${cashFundCount} fund(s)` : 'No registry items yet',
      },
      {
        key: 'ceremony',
        label: 'Ceremony',
        href: '/dashboard/ceremony',
        status: deriveStatus(ceremonyCount, ceremonyProgress),
        progress: ceremonyProgress,
        itemCount: ceremonyCount,
        description: ceremonyCount > 0 ? `${ceremonyCount} outline item(s)` : 'No ceremony outline yet',
      },
      {
        key: 'music',
        label: 'Music',
        href: '/dashboard/music',
        status: deriveStatus(playlistCount, playlistProgress),
        progress: playlistProgress,
        itemCount: playlistCount,
        description: playlistCount > 0 ? `${playlistCount} playlist(s) created` : 'No playlists yet',
      },
      {
        key: 'honeymoon',
        label: 'Honeymoon',
        href: '/dashboard/honeymoon',
        status: deriveStatus(honeymoonCount, honeymoonProgress),
        progress: honeymoonProgress,
        itemCount: honeymoonCount,
        description: honeymoonCount > 0 ? `${honeymoonCount} plan(s) created` : 'No honeymoon plans yet',
      },
      {
        key: 'communication',
        label: 'Communication',
        href: '/dashboard/communication',
        status: deriveStatus(emailCount, emailProgress),
        progress: emailProgress,
        itemCount: emailCount,
        description: emailCount > 0 ? `${emailCount} campaign(s)` : 'No email campaigns yet',
      },
    ]

    const overallProgress = Math.round(
      features.reduce((sum, f) => sum + f.progress, 0) / features.length,
    )

    return { features, overallProgress }
  },
}
