import { eq, desc } from 'drizzle-orm'
import { db, activityLog, users } from '@planfortwo/db'
import type { ActivityAction, EntityType } from '@planfortwo/types'

interface LogParams {
  weddingId: string
  userId: string
  action: ActivityAction
  entityType: EntityType
  entityId: string
  metadata?: Record<string, unknown>
}

export const activityService = {
  async log(params: LogParams) {
    const [entry] = await db
      .insert(activityLog)
      .values({
        weddingId: params.weddingId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ?? null,
      })
      .returning()

    return entry!
  },

  async getRecent(weddingId: string, limit = 20) {
    const results = await db
      .select({
        activity: activityLog,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(activityLog)
      .innerJoin(users, eq(activityLog.userId, users.id))
      .where(eq(activityLog.weddingId, weddingId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)

    return results.map((r) => ({
      ...r.activity,
      user: r.user,
    }))
  },
}
