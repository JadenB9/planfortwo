import { randomUUID } from 'crypto'
import { eq, and, or, ilike, count, desc, asc, inArray, isNull, isNotNull } from 'drizzle-orm'
import { db, guests, guestTags, guestTagAssignments, households, weddings } from '@planfortwo/db'
import type {
  GuestWithTags,
  GuestStats,
  DietarySummary,
  CsvImportResult,
  DietaryInfo,
} from '@planfortwo/types'
import type { GuestFiltersInput, CreateGuestInput, UpdateGuestInput } from '@planfortwo/validators'
import { activityService } from './activity.js'
import Papa from 'papaparse'

async function getTagsForGuest(guestId: string) {
  const assignments = await db
    .select({
      tag: guestTags,
    })
    .from(guestTagAssignments)
    .innerJoin(guestTags, eq(guestTagAssignments.tagId, guestTags.id))
    .where(eq(guestTagAssignments.guestId, guestId))

  return assignments.map((a) => a.tag)
}

async function getTagsForGuests(guestIds: string[]) {
  if (guestIds.length === 0) return new Map<string, (typeof guestTags.$inferSelect)[]>()

  const assignments = await db
    .select({
      guestId: guestTagAssignments.guestId,
      tag: guestTags,
    })
    .from(guestTagAssignments)
    .innerJoin(guestTags, eq(guestTagAssignments.tagId, guestTags.id))
    .where(inArray(guestTagAssignments.guestId, guestIds))

  const map = new Map<string, (typeof guestTags.$inferSelect)[]>()
  for (const a of assignments) {
    const existing = map.get(a.guestId) ?? []
    existing.push(a.tag)
    map.set(a.guestId, existing)
  }
  return map
}

export const guestService = {
  async listGuests(filters: GuestFiltersInput) {
    const conditions: ReturnType<typeof eq>[] = [eq(guests.weddingId, filters.weddingId)]

    if (filters.rsvpStatus) {
      conditions.push(eq(guests.rsvpStatus, filters.rsvpStatus))
    }

    if (filters.side) {
      conditions.push(eq(guests.side, filters.side))
    }

    if (filters.isChild !== undefined) {
      conditions.push(eq(guests.isChild, filters.isChild))
    }

    if (filters.isVip !== undefined) {
      conditions.push(eq(guests.isVip, filters.isVip))
    }

    if (filters.hasPlusOne !== undefined) {
      conditions.push(eq(guests.hasPlusOne, filters.hasPlusOne))
    }

    if (filters.householdId) {
      conditions.push(eq(guests.householdId, filters.householdId))
    }

    if (filters.search) {
      const escaped = filters.search.replace(/[%_\\]/g, '\\$&')
      const term = `%${escaped}%`
      conditions.push(or(ilike(guests.firstName, term), ilike(guests.lastName, term))!)
    }

    // For tag filtering, we need a subquery
    let guestIdsWithTag: string[] | null = null
    if (filters.tagId) {
      const tagAssignments = await db
        .select({ guestId: guestTagAssignments.guestId })
        .from(guestTagAssignments)
        .where(eq(guestTagAssignments.tagId, filters.tagId))

      guestIdsWithTag = tagAssignments.map((a) => a.guestId)
      if (guestIdsWithTag.length === 0) {
        return {
          data: [],
          total: 0,
          page: filters.page,
          pageSize: filters.pageSize,
          hasMore: false,
        }
      }
      conditions.push(inArray(guests.id, guestIdsWithTag))
    }

    // Count total
    const [totalResult] = await db
      .select({ cnt: count() })
      .from(guests)
      .where(and(...conditions))

    const total = totalResult?.cnt ?? 0

    // Sorting
    const sortMap = {
      name: asc(guests.lastName),
      rsvpStatus: asc(guests.rsvpStatus),
      createdAt: desc(guests.createdAt),
      sortOrder: asc(guests.sortOrder),
    } as const

    const orderBy = sortMap[filters.sortBy ?? 'sortOrder']
    const offset = (filters.page - 1) * filters.pageSize

    const guestRows = await db
      .select()
      .from(guests)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(filters.pageSize)
      .offset(offset)

    // Batch-load tags and households
    const guestIds = guestRows.map((g) => g.id)
    const tagsMap = await getTagsForGuests(guestIds)

    const householdIds = [
      ...new Set(guestRows.map((g) => g.householdId).filter(Boolean)),
    ] as string[]
    let householdsMap = new Map<string, typeof households.$inferSelect>()
    if (householdIds.length > 0) {
      const householdRows = await db
        .select()
        .from(households)
        .where(inArray(households.id, householdIds))

      for (const h of householdRows) {
        householdsMap.set(h.id, h)
      }
    }

    const data: GuestWithTags[] = guestRows.map((g) => ({
      ...g,
      dietary: (g.dietary as DietaryInfo) ?? null,
      plusOneDietary: (g.plusOneDietary as DietaryInfo) ?? null,
      tags: tagsMap.get(g.id) ?? [],
      household: g.householdId ? (householdsMap.get(g.householdId) ?? null) : null,
    }))

    return {
      data,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: offset + guestRows.length < total,
    }
  },

  async getGuest(id: string) {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id))

    if (!guest) return null

    const tags = await getTagsForGuest(id)

    let household = null
    if (guest.householdId) {
      const [h] = await db.select().from(households).where(eq(households.id, guest.householdId))
      household = h ?? null
    }

    return {
      ...guest,
      dietary: (guest.dietary as DietaryInfo) ?? null,
      plusOneDietary: (guest.plusOneDietary as DietaryInfo) ?? null,
      tags,
      household,
    } as GuestWithTags
  },

  async createGuest(input: CreateGuestInput, userId: string) {
    const rsvpToken = randomUUID()

    const [guest] = await db
      .insert(guests)
      .values({
        weddingId: input.weddingId,
        householdId: input.householdId ?? null,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        side: input.side ?? null,
        isChild: input.isChild ?? false,
        age: input.age ?? null,
        isVip: input.isVip ?? false,
        hasPlusOne: input.hasPlusOne ?? false,
        plusOneName: input.plusOneName ?? null,
        dietary: input.dietary ?? null,
        mealChoice: input.mealChoice ?? null,
        rsvpToken,
      })
      .returning()

    if (guest && input.tagIds && input.tagIds.length > 0) {
      await this.setTagsForGuest(guest.id, input.tagIds)
    }

    if (guest) {
      await activityService.log({
        weddingId: input.weddingId,
        userId,
        action: 'guest_created',
        entityType: 'guest',
        entityId: guest.id,
        metadata: { name: `${input.firstName} ${input.lastName}` },
      })
    }

    return guest!
  },

  async updateGuest(id: string, input: UpdateGuestInput, userId: string, weddingId: string) {
    const updateData: Record<string, unknown> = {}

    if (input.householdId !== undefined) updateData.householdId = input.householdId
    if (input.firstName !== undefined) updateData.firstName = input.firstName
    if (input.lastName !== undefined) updateData.lastName = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.side !== undefined) updateData.side = input.side
    if (input.isChild !== undefined) updateData.isChild = input.isChild
    if (input.age !== undefined) updateData.age = input.age
    if (input.isVip !== undefined) updateData.isVip = input.isVip
    if (input.hasPlusOne !== undefined) updateData.hasPlusOne = input.hasPlusOne
    if (input.plusOneName !== undefined) updateData.plusOneName = input.plusOneName
    if (input.dietary !== undefined) updateData.dietary = input.dietary
    if (input.mealChoice !== undefined) updateData.mealChoice = input.mealChoice
    if (input.rsvpStatus !== undefined) updateData.rsvpStatus = input.rsvpStatus
    if (input.songRequest !== undefined) updateData.songRequest = input.songRequest
    if (input.rsvpNotes !== undefined) updateData.rsvpNotes = input.rsvpNotes

    const [updated] = await db.update(guests).set(updateData).where(eq(guests.id, id)).returning()

    if (updated && input.tagIds !== undefined) {
      await this.setTagsForGuest(id, input.tagIds)
    }

    if (updated) {
      await activityService.log({
        weddingId,
        userId,
        action: 'guest_updated',
        entityType: 'guest',
        entityId: id,
        metadata: { changes: Object.keys(updateData) },
      })
    }

    return updated ?? null
  },

  async deleteGuest(id: string, userId: string, weddingId: string) {
    const [guest] = await db
      .select({ firstName: guests.firstName, lastName: guests.lastName })
      .from(guests)
      .where(eq(guests.id, id))

    if (!guest) {
      throw new Error('Guest not found')
    }

    await db.delete(guests).where(eq(guests.id, id))

    await activityService.log({
      weddingId,
      userId,
      action: 'guest_deleted',
      entityType: 'guest',
      entityId: id,
      metadata: { name: `${guest.firstName} ${guest.lastName}` },
    })
  },

  async getGuestCount(weddingId: string): Promise<number> {
    const [result] = await db
      .select({ cnt: count() })
      .from(guests)
      .where(eq(guests.weddingId, weddingId))

    return result?.cnt ?? 0
  },

  async getStats(weddingId: string): Promise<GuestStats> {
    const allGuests = await db.select().from(guests).where(eq(guests.weddingId, weddingId))

    const totalGuests = allGuests.length
    const adults = allGuests.filter((g) => !g.isChild).length
    const children = allGuests.filter((g) => g.isChild).length
    const plusOnes = allGuests.filter((g) => g.hasPlusOne).length
    const confirmedPlusOnes = allGuests.filter((g) => g.plusOneConfirmed).length

    const rsvpAccepted = allGuests.filter((g) => g.rsvpStatus === 'accepted').length
    const rsvpDeclined = allGuests.filter((g) => g.rsvpStatus === 'declined').length
    const rsvpPending = allGuests.filter((g) => g.rsvpStatus === 'pending').length
    const rsvpMaybe = allGuests.filter((g) => g.rsvpStatus === 'maybe').length

    // Dietary summary
    const dietarySummary: DietarySummary = {
      vegetarian: 0,
      vegan: 0,
      glutenFree: 0,
      kosher: 0,
      halal: 0,
      withAllergies: 0,
    }

    for (const g of allGuests) {
      const d = g.dietary as DietaryInfo | null
      if (!d) continue
      if (d.vegetarian) dietarySummary.vegetarian++
      if (d.vegan) dietarySummary.vegan++
      if (d.glutenFree) dietarySummary.glutenFree++
      if (d.kosher) dietarySummary.kosher++
      if (d.halal) dietarySummary.halal++
      if (d.allergies && d.allergies.length > 0) dietarySummary.withAllergies++
    }

    // Meal choice summary
    const mealChoiceSummary: Record<string, number> = {}
    for (const g of allGuests) {
      if (g.mealChoice) {
        mealChoiceSummary[g.mealChoice] = (mealChoiceSummary[g.mealChoice] ?? 0) + 1
      }
    }

    return {
      totalGuests,
      adults,
      children,
      plusOnes,
      confirmedPlusOnes,
      rsvpAccepted,
      rsvpDeclined,
      rsvpPending,
      rsvpMaybe,
      dietarySummary,
      mealChoiceSummary,
    }
  },

  async setTagsForGuest(guestId: string, tagIds: string[]) {
    // Delete existing assignments
    await db.delete(guestTagAssignments).where(eq(guestTagAssignments.guestId, guestId))

    // Insert new ones
    if (tagIds.length > 0) {
      await db.insert(guestTagAssignments).values(tagIds.map((tagId) => ({ guestId, tagId })))
    }
  },

  async exportCsv(weddingId: string): Promise<string> {
    const allGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.weddingId, weddingId))
      .orderBy(asc(guests.lastName), asc(guests.firstName))

    const rows = allGuests.map((g) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email ?? '',
      phone: g.phone ?? '',
      rsvpStatus: g.rsvpStatus,
      side: g.side ?? '',
      isChild: g.isChild ? 'yes' : 'no',
      isVip: g.isVip ? 'yes' : 'no',
      hasPlusOne: g.hasPlusOne ? 'yes' : 'no',
      plusOneName: g.plusOneName ?? '',
      plusOneConfirmed: g.plusOneConfirmed ? 'yes' : 'no',
      mealChoice: g.mealChoice ?? '',
      songRequest: g.songRequest ?? '',
    }))

    return Papa.unparse(rows)
  },

  async bulkImportCsv(
    weddingId: string,
    csvContent: string,
    userId: string,
  ): Promise<CsvImportResult> {
    const result: CsvImportResult = { imported: 0, skipped: 0, errors: [] }

    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, ''),
    })

    if (parsed.errors.length > 0) {
      for (const err of parsed.errors) {
        result.errors.push(`Row ${err.row}: ${err.message}`)
      }
    }

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]!
      const firstName = (row.firstname ?? row.first_name ?? '').trim()
      const lastName = (row.lastname ?? row.last_name ?? '').trim()

      if (!firstName || !lastName) {
        result.errors.push(`Row ${i + 1}: Missing first or last name`)
        result.skipped++
        continue
      }

      try {
        await db.insert(guests).values({
          weddingId,
          firstName,
          lastName,
          email: (row.email ?? '').trim() || null,
          phone: (row.phone ?? '').trim() || null,
          side: ['bride', 'groom', 'both'].includes(row.side ?? '')
            ? (row.side as 'bride' | 'groom' | 'both')
            : null,
          isChild: (row.ischild ?? row.is_child ?? '').toLowerCase() === 'yes',
          isVip: (row.isvip ?? row.is_vip ?? '').toLowerCase() === 'yes',
          hasPlusOne: (row.hasplusone ?? row.has_plus_one ?? '').toLowerCase() === 'yes',
          plusOneName: (row.plusonename ?? row.plus_one_name ?? '').trim() || null,
          mealChoice: (row.mealchoice ?? row.meal_choice ?? '').trim() || null,
          rsvpToken: randomUUID(),
        })
        result.imported++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Insert failed'
        result.errors.push(`Row ${i + 1}: ${message}`)
        result.skipped++
      }
    }

    if (result.imported > 0) {
      await activityService.log({
        weddingId,
        userId,
        action: 'guest_imported',
        entityType: 'guest',
        entityId: weddingId,
        metadata: { imported: result.imported, skipped: result.skipped },
      })
    }

    return result
  },

  async markInviteSent(guestId: string) {
    const [updated] = await db
      .update(guests)
      .set({ inviteSentAt: new Date() })
      .where(eq(guests.id, guestId))
      .returning()
    return updated ?? null
  },

  async getGuestsForInvite(weddingId: string) {
    return db
      .select()
      .from(guests)
      .where(
        and(eq(guests.weddingId, weddingId), isNotNull(guests.email), isNull(guests.inviteSentAt)),
      )
  },
}
