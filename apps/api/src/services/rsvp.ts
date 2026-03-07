import { eq, and, ilike } from 'drizzle-orm'
import { db, guests, households, weddings } from '@planfortwo/db'
import type { RsvpLookupResult, Guest } from '@planfortwo/types'
import type { RsvpSubmissionInput } from '@planfortwo/validators'

export const rsvpService = {
  async lookupByToken(token: string): Promise<RsvpLookupResult | null> {
    const [guest] = await db.select().from(guests).where(eq(guests.rsvpToken, token)).limit(1)

    if (!guest) return null

    return this.buildLookupResult(guest)
  },

  async lookupByCode(code: string): Promise<RsvpLookupResult | null> {
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.rsvpCode, code))
      .limit(1)

    if (!household) return null

    const householdGuests = await db
      .select()
      .from(guests)
      .where(eq(guests.householdId, household.id))

    if (householdGuests.length === 0) return null

    const primaryGuest = householdGuests[0]!
    const [wedding] = await db
      .select()
      .from(weddings)
      .where(eq(weddings.id, primaryGuest.weddingId))
      .limit(1)

    if (!wedding) return null

    const isExpired = await this.isDeadlinePassed(wedding.id)

    return {
      guest: this.stripSensitiveFields(primaryGuest) as Guest,
      household,
      householdGuests: householdGuests.map((g) => this.stripSensitiveFields(g)) as Guest[],
      weddingName: wedding.name,
      weddingDate: wedding.date,
      rsvpDeadline: wedding.rsvpDeadline,
      isExpired,
    }
  },

  async lookupByGuestId(guestId: string, weddingId: string): Promise<RsvpLookupResult | null> {
    const [guest] = await db
      .select()
      .from(guests)
      .where(and(eq(guests.id, guestId), eq(guests.weddingId, weddingId)))
      .limit(1)

    if (!guest) return null

    return this.buildLookupResult(guest)
  },

  async lookupByName(
    weddingId: string,
    firstName: string,
    lastName: string,
  ): Promise<
    | { type: 'single'; result: RsvpLookupResult }
    | { type: 'multiple'; guests: Omit<Guest, 'email' | 'phone' | 'rsvpToken'>[] }
    | { type: 'none' }
  > {
    const results = await db
      .select()
      .from(guests)
      .where(
        and(
          eq(guests.weddingId, weddingId),
          ilike(guests.firstName, firstName),
          ilike(guests.lastName, lastName),
        ),
      )

    if (results.length === 0) {
      return { type: 'none' }
    }

    if (results.length === 1) {
      const result = await this.buildLookupResult(results[0]!)
      return { type: 'single', result }
    }

    return {
      type: 'multiple',
      guests: results.map((g) => this.stripSensitiveFields(g)) as Omit<
        Guest,
        'email' | 'phone' | 'rsvpToken'
      >[],
    }
  },

  async submitRsvp(submission: RsvpSubmissionInput, weddingId: string): Promise<Guest> {
    const expired = await this.isDeadlinePassed(weddingId)
    if (expired) {
      throw new Error('RSVP deadline has passed')
    }

    const [updated] = await db
      .update(guests)
      .set({
        rsvpStatus: submission.rsvpStatus,
        mealChoice: submission.mealChoice ?? null,
        dietary: (submission.dietary as Record<string, unknown>) ?? null,
        songRequest: submission.songRequest ?? null,
        rsvpNotes: submission.rsvpNotes ?? null,
        plusOneName: submission.plusOneName ?? null,
        plusOneConfirmed: submission.plusOneConfirmed ?? false,
        plusOneMealChoice: submission.plusOneMealChoice ?? null,
        plusOneDietary: (submission.plusOneDietary as Record<string, unknown>) ?? null,
        rsvpRespondedAt: new Date(),
      })
      .where(eq(guests.id, submission.guestId))
      .returning()

    if (!updated) {
      throw new Error('Guest not found')
    }

    return updated as Guest
  },

  async submitBatchRsvp(submissions: RsvpSubmissionInput[], weddingId: string): Promise<Guest[]> {
    const expired = await this.isDeadlinePassed(weddingId)
    if (expired) {
      throw new Error('RSVP deadline has passed')
    }

    const results: Guest[] = []

    await db.transaction(async (tx) => {
      for (const submission of submissions) {
        const [updated] = await tx
          .update(guests)
          .set({
            rsvpStatus: submission.rsvpStatus,
            mealChoice: submission.mealChoice ?? null,
            dietary: (submission.dietary as Record<string, unknown>) ?? null,
            songRequest: submission.songRequest ?? null,
            rsvpNotes: submission.rsvpNotes ?? null,
            plusOneName: submission.plusOneName ?? null,
            plusOneConfirmed: submission.plusOneConfirmed ?? false,
            plusOneMealChoice: submission.plusOneMealChoice ?? null,
            plusOneDietary: (submission.plusOneDietary as Record<string, unknown>) ?? null,
            rsvpRespondedAt: new Date(),
          })
          .where(eq(guests.id, submission.guestId))
          .returning()

        if (!updated) {
          throw new Error(`Guest ${submission.guestId} not found`)
        }

        results.push(updated as Guest)
      }
    })

    return results
  },

  async isDeadlinePassed(weddingId: string): Promise<boolean> {
    const [wedding] = await db
      .select({ rsvpDeadline: weddings.rsvpDeadline })
      .from(weddings)
      .where(eq(weddings.id, weddingId))
      .limit(1)

    if (!wedding?.rsvpDeadline) return false

    return new Date() > new Date(wedding.rsvpDeadline)
  },

  stripSensitiveFields(
    guest: typeof guests.$inferSelect,
  ): Omit<Guest, 'email' | 'phone' | 'rsvpToken'> {
    const { email: _e, phone: _p, rsvpToken: _t, ...safe } = guest
    return safe as Omit<Guest, 'email' | 'phone' | 'rsvpToken'>
  },

  async buildLookupResult(guest: typeof guests.$inferSelect): Promise<RsvpLookupResult> {
    const [wedding] = await db
      .select()
      .from(weddings)
      .where(eq(weddings.id, guest.weddingId))
      .limit(1)

    if (!wedding) {
      throw new Error('Wedding not found')
    }

    let household = null
    let householdGuests: Omit<Guest, 'email' | 'phone' | 'rsvpToken'>[] = []

    if (guest.householdId) {
      const [hh] = await db
        .select()
        .from(households)
        .where(eq(households.id, guest.householdId))
        .limit(1)

      household = hh ?? null

      if (household) {
        const hhGuests = await db.select().from(guests).where(eq(guests.householdId, household.id))

        householdGuests = hhGuests.map((g) => this.stripSensitiveFields(g))
      }
    }

    const isExpired = await this.isDeadlinePassed(wedding.id)

    // Keep rsvpToken on primary guest so the frontend can pass it back on submit
    const { email: _e, phone: _p, ...primarySafe } = guest

    return {
      guest: primarySafe as Guest,
      household,
      householdGuests: householdGuests as Guest[],
      weddingName: wedding.name,
      weddingDate: wedding.date,
      rsvpDeadline: wedding.rsvpDeadline,
      isExpired,
    }
  },
}
