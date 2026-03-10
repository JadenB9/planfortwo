import { eq } from 'drizzle-orm'
import { db, weddings } from '@planfortwo/db'
import type { FeatureGates, PricingTier } from '@planfortwo/types'

const FREE_GATES: FeatureGates = {
  tier: 'free',
  // Checklist — free
  canAddTasks: true,
  canEditChecklist: true,
  canDeleteTasks: true,
  canReorderTasks: true,
  canCustomizeCategories: true,
  canAddNotes: true,
  canAddAttachments: true,
  // Guests — free (unlimited)
  maxGuests: null,
  canEditGuests: true,
  canDeleteGuests: true,
  canBulkImport: true,
  canRsvp: true,
  // Seating charts — premium
  canSeatingChart: false,
  // Vendors — free
  canVendorManagement: true,
  // Custom domain — premium (part of website customization)
  canCustomDomain: false,
  // Data export — free
  canDataExport: true,
  // Budget — free
  canBudgetCategories: true,
  canBudgetExpenses: true,
  canBudgetAnalytics: true,
  canBudgetExport: true,
  canPaymentSchedule: true,
  // Website — basic free, customization premium
  canWebsiteBuilder: true,
  canWebsiteAnalytics: false,
  canWebsiteCustomSections: false,
  // Inbox, music, photos — premium
  canInbox: false,
  canMusicIntegration: false,
  canPhotoGallery: false,
}

const FULL_GATES: FeatureGates = {
  tier: 'full',
  canAddTasks: true,
  canEditChecklist: true,
  canDeleteTasks: true,
  canReorderTasks: true,
  canCustomizeCategories: true,
  canAddNotes: true,
  canAddAttachments: true,
  maxGuests: null,
  canEditGuests: true,
  canDeleteGuests: true,
  canBulkImport: true,
  canRsvp: true,
  canSeatingChart: true,
  canVendorManagement: true,
  canCustomDomain: true,
  canDataExport: true,
  canBudgetCategories: true,
  canBudgetExpenses: true,
  canBudgetAnalytics: true,
  canBudgetExport: true,
  canPaymentSchedule: true,
  canWebsiteBuilder: true,
  canWebsiteAnalytics: true,
  canWebsiteCustomSections: true,
  canInbox: true,
  canMusicIntegration: true,
  canPhotoGallery: true,
}

function gatesForTier(tier: PricingTier): FeatureGates {
  return tier === 'full' ? FULL_GATES : FREE_GATES
}

export const featureService = {
  async getFeatures(weddingId: string): Promise<FeatureGates> {
    const [wedding] = await db
      .select({ tier: weddings.tier })
      .from(weddings)
      .where(eq(weddings.id, weddingId))

    if (!wedding) {
      return FREE_GATES
    }

    return gatesForTier(wedding.tier)
  },
}
