import { eq } from 'drizzle-orm'
import { db, households, guests } from '@planfortwo/db'
import type { CreateHouseholdInput, UpdateHouseholdInput } from '@planfortwo/validators'
import { activityService } from './activity.js'

function generateRsvpCode(name: string): string {
  const words = name.trim().split(/\s+/)
  const lastWord = words[words.length - 1] ?? 'GUEST'
  const year = new Date().getFullYear()
  return `${lastWord.toUpperCase()}${year}`
}

export const householdService = {
  async listHouseholds(weddingId: string) {
    const allHouseholds = await db
      .select()
      .from(households)
      .where(eq(households.weddingId, weddingId))
      .orderBy(households.createdAt)

    const allGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.weddingId, weddingId))

    return allHouseholds.map((h) => ({
      ...h,
      guests: allGuests.filter((g) => g.householdId === h.id),
    }))
  },

  async getHousehold(id: string) {
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, id))

    if (!household) return null

    const householdGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.householdId, id))

    return {
      ...household,
      guests: householdGuests,
    }
  },

  async createHousehold(input: CreateHouseholdInput, userId: string) {
    let rsvpCode = generateRsvpCode(input.name)

    // Ensure uniqueness by checking DB and appending random digits if needed
    let attempts = 0
    while (attempts < 10) {
      const [existing] = await db
        .select({ id: households.id })
        .from(households)
        .where(eq(households.rsvpCode, rsvpCode))

      if (!existing) break

      const rand = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')
      rsvpCode = `${generateRsvpCode(input.name)}${rand}`
      attempts++
    }

    const [household] = await db
      .insert(households)
      .values({
        weddingId: input.weddingId,
        name: input.name,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zip: input.zip ?? null,
        country: input.country ?? null,
        rsvpCode,
      })
      .returning()

    if (household) {
      await activityService.log({
        weddingId: input.weddingId,
        userId,
        action: 'household_created',
        entityType: 'household',
        entityId: household.id,
        metadata: { name: input.name },
      })
    }

    return household!
  },

  async updateHousehold(id: string, input: UpdateHouseholdInput) {
    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.address !== undefined) updateData.address = input.address
    if (input.city !== undefined) updateData.city = input.city
    if (input.state !== undefined) updateData.state = input.state
    if (input.zip !== undefined) updateData.zip = input.zip
    if (input.country !== undefined) updateData.country = input.country

    const [updated] = await db
      .update(households)
      .set(updateData)
      .where(eq(households.id, id))
      .returning()

    return updated ?? null
  },

  async deleteHousehold(id: string, userId: string, weddingId: string) {
    const [household] = await db
      .select({ name: households.name })
      .from(households)
      .where(eq(households.id, id))

    if (!household) {
      throw new Error('Household not found')
    }

    // Nullify guest householdIds first
    await db
      .update(guests)
      .set({ householdId: null })
      .where(eq(guests.householdId, id))

    await db.delete(households).where(eq(households.id, id))

    await activityService.log({
      weddingId,
      userId,
      action: 'household_deleted',
      entityType: 'household',
      entityId: id,
      metadata: { name: household.name },
    })
  },
}
