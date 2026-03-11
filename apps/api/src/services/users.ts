import { eq, and } from 'drizzle-orm'
import { db, users, weddings, weddingMembers, partnerInvitations } from '@planfortwo/db'

interface CreateUserData {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

interface UpdateUserData {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

export const userService = {
  async handleUserCreated(data: CreateUserData) {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          clerkId: data.clerkId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          avatarUrl: data.avatarUrl,
        })
        .returning()

      if (!user) {
        throw new Error('Failed to create user')
      }

      // Check if this user has a pending partner invitation — if so,
      // skip creating a default wedding (they'll join the inviter's wedding)
      const pendingInvites = await tx
        .select()
        .from(partnerInvitations)
        .where(
          and(eq(partnerInvitations.email, data.email), eq(partnerInvitations.status, 'pending')),
        )

      if (pendingInvites.length > 0) {
        return
      }

      const [wedding] = await tx.insert(weddings).values({ name: 'Our Wedding' }).returning()

      if (!wedding) {
        throw new Error('Failed to create default wedding')
      }

      await tx.insert(weddingMembers).values({
        weddingId: wedding.id,
        userId: user.id,
        role: 'owner',
        joinedAt: new Date(),
      })
    })
  },

  async handleUserUpdated(data: UpdateUserData) {
    await db
      .update(users)
      .set({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
      })
      .where(eq(users.clerkId, data.clerkId))
  },

  async handleUserDeleted(clerkId: string) {
    await db.transaction(async (tx) => {
      // Find the user being deleted
      const [user] = await tx.select().from(users).where(eq(users.clerkId, clerkId))
      if (!user) return

      // Find all weddings this user belongs to, with their role
      const memberships = await tx
        .select({ weddingId: weddingMembers.weddingId, role: weddingMembers.role })
        .from(weddingMembers)
        .where(eq(weddingMembers.userId, user.id))

      // Separate owner-weddings from non-owner memberships
      const ownedWeddingIds = memberships.filter((m) => m.role === 'owner').map((m) => m.weddingId)
      const nonOwnedWeddingIds = memberships
        .filter((m) => m.role !== 'owner')
        .map((m) => m.weddingId)

      // Delete all weddings the user owns — cascades to wedding_members,
      // website_configs, guests, budget, everything. Other members'
      // activeWeddingId is set to null via FK onDelete: 'set null'.
      for (const weddingId of ownedWeddingIds) {
        await tx.delete(weddings).where(eq(weddings.id, weddingId))
      }

      // Delete the user (cascades to remaining wedding_members, activity_log, etc.)
      await tx.delete(users).where(eq(users.id, user.id))

      // For non-owned weddings, check if any members remain — delete orphaned ones
      for (const weddingId of nonOwnedWeddingIds) {
        const remainingMembers = await tx
          .select({ id: weddingMembers.id })
          .from(weddingMembers)
          .where(eq(weddingMembers.weddingId, weddingId))
          .limit(1)

        if (remainingMembers.length === 0) {
          await tx.delete(weddings).where(eq(weddings.id, weddingId))
        }
      }
    })
  },

  async findByClerkId(clerkId: string) {
    const results = await db.select().from(users).where(eq(users.clerkId, clerkId))

    return results[0] ?? null
  },

  async findById(id: string) {
    const results = await db.select().from(users).where(eq(users.id, id))

    return results[0] ?? null
  },
}
