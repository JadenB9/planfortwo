import { eq } from 'drizzle-orm'
import { db, weddings } from '@planfortwo/db'
import type { FeatureGates, PricingTier } from '@planfortwo/types'

const FREE_GATES: FeatureGates = {
  tier: 'free',
  canAddTasks: false,
  canEditChecklist: false,
  canDeleteTasks: false,
  canReorderTasks: false,
  canCustomizeCategories: false,
  canAddNotes: false,
  canAddAttachments: false,
  maxGuests: 15,
  canEditGuests: false,
  canDeleteGuests: false,
  canBulkImport: false,
  canRsvp: false,
  canSeatingChart: false,
  canVendorManagement: false,
  canCustomDomain: false,
  canDataExport: false,
  canBudgetCategories: false,
  canBudgetExpenses: false,
  canBudgetAnalytics: false,
  canBudgetExport: false,
  canPaymentSchedule: false,
  canWebsiteBuilder: true,
  canWebsiteAnalytics: false,
  canWebsiteCustomSections: false,
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
