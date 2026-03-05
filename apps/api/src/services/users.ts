import { eq } from 'drizzle-orm'
import { db, users, weddings, weddingMembers } from '@planfortwo/db'

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
    await db.delete(users).where(eq(users.clerkId, clerkId))
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
