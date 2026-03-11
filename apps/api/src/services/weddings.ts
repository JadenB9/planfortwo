import { eq, and } from 'drizzle-orm'
import { db, weddings, weddingMembers, users } from '@planfortwo/db'
import { invitationService } from './invitations.js'

interface OnboardingData {
  name?: string
  date?: Date
  venue?: string
  city?: string
  state?: string
  country?: string
  guestCountEstimate?: number
  budgetTotal?: string
  style?:
    | 'classic'
    | 'modern'
    | 'rustic'
    | 'romantic'
    | 'minimalist'
    | 'bohemian'
    | 'garden'
    | 'beach'
    | 'elegant'
    | 'whimsical'
  timelineTemplate?: '6-month' | '12-month' | '18-month' | 'elopement'
}

export const weddingService = {
  async findByUserId(userId: string) {
    // Check if user has an active wedding preference
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (user?.activeWeddingId) {
      const membership = await this.verifyMembership(user.activeWeddingId, userId)
      if (membership) {
        const [wedding] = await db
          .select()
          .from(weddings)
          .where(eq(weddings.id, user.activeWeddingId))
        if (wedding) return wedding
      }
      // Active wedding no longer valid — clear it
      await db.update(users).set({ activeWeddingId: null }).where(eq(users.id, userId))
    }

    const results = await db
      .select({ wedding: weddings, role: weddingMembers.role })
      .from(weddingMembers)
      .innerJoin(weddings, eq(weddingMembers.weddingId, weddings.id))
      .where(eq(weddingMembers.userId, userId))

    if (results.length === 0) return null
    if (results.length === 1) return results[0]!.wedding

    // Prefer the wedding where onboarding is completed
    const onboarded = results.find((r) => r.wedding.onboardingCompleted)
    if (onboarded) return onboarded.wedding

    // Prefer the wedding where the user is owner
    const asOwner = results.find((r) => r.role === 'owner')
    if (asOwner) return asOwner.wedding

    // Prefer the wedding where the user is a partner (they were invited to it)
    const asPartner = results.find((r) => r.role === 'partner')
    if (asPartner) return asPartner.wedding

    return results[0]!.wedding
  },

  async findAllByUserId(userId: string) {
    const results = await db
      .select({
        wedding: weddings,
        role: weddingMembers.role,
        joinedAt: weddingMembers.joinedAt,
      })
      .from(weddingMembers)
      .innerJoin(weddings, eq(weddingMembers.weddingId, weddings.id))
      .where(eq(weddingMembers.userId, userId))

    return results.map((r) => ({
      id: r.wedding.id,
      name: r.wedding.name,
      date: r.wedding.date,
      tier: r.wedding.tier,
      role: r.role,
      onboardingCompleted: r.wedding.onboardingCompleted,
      joinedAt: r.joinedAt,
    }))
  },

  async setActiveWedding(userId: string, weddingId: string) {
    const membership = await this.verifyMembership(weddingId, userId)
    if (!membership) return null

    await db.update(users).set({ activeWeddingId: weddingId }).where(eq(users.id, userId))
    return { weddingId }
  },

  async completeOnboarding(weddingId: string, data: OnboardingData) {
    const [updated] = await db
      .update(weddings)
      .set({
        ...data,
        onboardingCompleted: true,
      })
      .where(eq(weddings.id, weddingId))
      .returning()

    return updated ?? null
  },

  async update(weddingId: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.date !== undefined) updateData.date = data.date
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.country !== undefined) updateData.country = data.country
    if (data.guestCountEstimate !== undefined)
      updateData.guestCountEstimate = data.guestCountEstimate
    if (data.budgetTotal !== undefined) updateData.budgetTotal = data.budgetTotal
    if (data.style !== undefined) updateData.style = data.style
    if (data.themeColors !== undefined) updateData.themeColors = data.themeColors

    if (Object.keys(updateData).length === 0) return null

    const [updated] = await db
      .update(weddings)
      .set(updateData)
      .where(eq(weddings.id, weddingId))
      .returning()

    return updated ?? null
  },

  async verifyMembership(weddingId: string, userId: string) {
    const results = await db
      .select()
      .from(weddingMembers)
      .where(and(eq(weddingMembers.weddingId, weddingId), eq(weddingMembers.userId, userId)))

    return results[0] ?? null
  },

  async getMembers(weddingId: string) {
    const results = await db
      .select({
        member: weddingMembers,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(weddingMembers)
      .innerJoin(users, eq(weddingMembers.userId, users.id))
      .where(eq(weddingMembers.weddingId, weddingId))

    return results
  },

  async addMemberByEmail(
    weddingId: string,
    email: string,
    role: 'planner' | 'family',
    invitedByUserId: string,
  ) {
    const [user] = await db.select().from(users).where(eq(users.email, email))

    if (!user) {
      // User doesn't have an account — send an invitation email
      try {
        const invitation = await invitationService.createAndSend(
          weddingId,
          invitedByUserId,
          email,
          role,
        )
        return {
          invited: true,
          invitation,
          message: "Invitation sent! They'll receive an email to create their account.",
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send invitation'
        return { error: message }
      }
    }

    // Check if already a member
    const existing = await this.verifyMembership(weddingId, user.id)
    if (existing) {
      return { error: 'This person is already a member of this wedding.' }
    }

    const [member] = await db
      .insert(weddingMembers)
      .values({
        weddingId,
        userId: user.id,
        role,
        joinedAt: new Date(),
      })
      .returning()

    return {
      member,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    }
  },

  async removeMember(weddingId: string, memberId: string) {
    const [member] = await db
      .select()
      .from(weddingMembers)
      .where(and(eq(weddingMembers.id, memberId), eq(weddingMembers.weddingId, weddingId)))

    if (!member) return null

    // Prevent removing the owner
    if (member.role === 'owner') {
      return { error: 'Cannot remove the wedding owner.' }
    }

    await db
      .delete(weddingMembers)
      .where(and(eq(weddingMembers.id, memberId), eq(weddingMembers.weddingId, weddingId)))

    return { removed: true }
  },
}
