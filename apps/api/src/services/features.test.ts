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
      expect(gates.canAddTasks).toBe(false)
      expect(gates.canEditChecklist).toBe(false)
      expect(gates.canDeleteTasks).toBe(false)
      expect(gates.canReorderTasks).toBe(false)
      expect(gates.canCustomizeCategories).toBe(false)
      expect(gates.canAddNotes).toBe(false)
      expect(gates.canAddAttachments).toBe(false)
      expect(gates.maxGuests).toBe(15)
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
    })

    it('should return free tier gates when wedding not found', async () => {
      ;(mockedDb.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const gates = await featureService.getFeatures('missing-wedding')

      expect(gates.tier).toBe('free')
      expect(gates.canAddTasks).toBe(false)
    })
  })
})
