import { eq, and } from 'drizzle-orm'
import { db, weddings, weddingMembers, users } from '@planfortwo/db'

interface OnboardingData {
  name?: string
  date?: Date
  venue?: string
  city?: string
  state?: string
  country?: string
  guestCountEstimate?: number
  budgetTotal?: string
  style?: 'classic' | 'modern' | 'rustic' | 'romantic' | 'minimalist' | 'bohemian' | 'garden' | 'beach' | 'elegant' | 'whimsical'
  timelineTemplate?: '6-month' | '12-month' | '18-month' | 'elopement'
}

export const weddingService = {
  async findByUserId(userId: string) {
    const results = await db
      .select({ wedding: weddings })
      .from(weddingMembers)
      .innerJoin(weddings, eq(weddingMembers.weddingId, weddings.id))
      .where(eq(weddingMembers.userId, userId))

    return results[0]?.wedding ?? null
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

  async verifyMembership(weddingId: string, userId: string) {
    const results = await db
      .select()
      .from(weddingMembers)
      .where(
        and(
          eq(weddingMembers.weddingId, weddingId),
          eq(weddingMembers.userId, userId),
        ),
      )

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
}
