import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@planfortwo/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
  }
  return {
    db: mockDb,
    weddings: { id: 'id', tier: 'tier' },
  }
})

import { featureService } from './features.js'
import { db } from '@planfortwo/db'

const mockedDb = vi.mocked(db)

describe('Feature Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFeatures', () => {
    it('should return all locked for free tier', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ tier: 'free' }]),
        }),
      })

      const gates = await featureService.getFeatures('wedding-1')

      expect(gates.tier).toBe('free')
      // Checklist — free
      expect(gates.canAddTasks).toBe(true)
      expect(gates.canEditChecklist).toBe(true)
      expect(gates.canDeleteTasks).toBe(true)
      expect(gates.canReorderTasks).toBe(true)
      expect(gates.canCustomizeCategories).toBe(true)
      expect(gates.canAddNotes).toBe(true)
      expect(gates.canAddAttachments).toBe(true)
      // Guests — free (unlimited)
      expect(gates.maxGuests).toBeNull()
      expect(gates.canEditGuests).toBe(true)
      expect(gates.canDeleteGuests).toBe(true)
      expect(gates.canBulkImport).toBe(true)
      expect(gates.canRsvp).toBe(true)
      // Seating charts — premium
      expect(gates.canSeatingChart).toBe(false)
      // Vendors — free
      expect(gates.canVendorManagement).toBe(true)
      // Custom domain — premium
      expect(gates.canCustomDomain).toBe(false)
      // Data export — free
      expect(gates.canDataExport).toBe(true)
      // Budget — free
      expect(gates.canBudgetCategories).toBe(true)
      expect(gates.canBudgetExpenses).toBe(true)
      expect(gates.canBudgetAnalytics).toBe(true)
      expect(gates.canBudgetExport).toBe(true)
      expect(gates.canPaymentSchedule).toBe(true)
      // Website — basic free, customization premium
      expect(gates.canWebsiteBuilder).toBe(true)
      expect(gates.canWebsiteAnalytics).toBe(false)
      expect(gates.canWebsiteCustomSections).toBe(false)
      // Inbox, music, photos — premium
      expect(gates.canInbox).toBe(false)
      expect(gates.canMusicIntegration).toBe(false)
      expect(gates.canPhotoGallery).toBe(false)
    })

    it('should return all unlocked for full tier', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ tier: 'full' }]),
        }),
      })

      const gates = await featureService.getFeatures('wedding-1')

      expect(gates.tier).toBe('full')
      expect(gates.canAddTasks).toBe(true)
      expect(gates.canEditChecklist).toBe(true)
      expect(gates.canDeleteTasks).toBe(true)
      expect(gates.canReorderTasks).toBe(true)
      expect(gates.canCustomizeCategories).toBe(true)
      expect(gates.canAddNotes).toBe(true)
      expect(gates.canAddAttachments).toBe(true)
      expect(gates.maxGuests).toBeNull()
      expect(gates.canEditGuests).toBe(true)
      expect(gates.canDeleteGuests).toBe(true)
      expect(gates.canBulkImport).toBe(true)
      expect(gates.canRsvp).toBe(true)
      expect(gates.canSeatingChart).toBe(true)
      expect(gates.canVendorManagement).toBe(true)
      expect(gates.canCustomDomain).toBe(true)
      expect(gates.canDataExport).toBe(true)
      expect(gates.canBudgetCategories).toBe(true)
      expect(gates.canBudgetExpenses).toBe(true)
      expect(gates.canBudgetAnalytics).toBe(true)
      expect(gates.canBudgetExport).toBe(true)
      expect(gates.canPaymentSchedule).toBe(true)
      expect(gates.canWebsiteBuilder).toBe(true)
      expect(gates.canWebsiteAnalytics).toBe(true)
      expect(gates.canWebsiteCustomSections).toBe(true)
      expect(gates.canInbox).toBe(true)
      expect(gates.canMusicIntegration).toBe(true)
      expect(gates.canPhotoGallery).toBe(true)
    })

    it('should return free tier gates when wedding not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const gates = await featureService.getFeatures('missing-wedding')

      expect(gates.tier).toBe('free')
      expect(gates.canAddTasks).toBe(true)
    })
  })
})
