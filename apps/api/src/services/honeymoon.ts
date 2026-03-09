import { eq, and, asc } from 'drizzle-orm'
import { db, honeymoonPlans, honeymoonActivities } from '@planfortwo/db'
import type {
  CreateHoneymoonPlanInput,
  UpdateHoneymoonPlanInput,
  CreateHoneymoonActivityInput,
  UpdateHoneymoonActivityInput,
} from '@planfortwo/validators'

export const honeymoonService = {
  async listPlans(weddingId: string) {
    return db
      .select()
      .from(honeymoonPlans)
      .where(eq(honeymoonPlans.weddingId, weddingId))
      .orderBy(asc(honeymoonPlans.createdAt))
  },

  async getPlan(id: string, weddingId: string) {
    const [plan] = await db
      .select()
      .from(honeymoonPlans)
      .where(and(eq(honeymoonPlans.id, id), eq(honeymoonPlans.weddingId, weddingId)))
    if (!plan) return null
    const activities = await db
      .select()
      .from(honeymoonActivities)
      .where(eq(honeymoonActivities.planId, id))
      .orderBy(asc(honeymoonActivities.dayNumber), asc(honeymoonActivities.sortOrder))
    return { ...plan, activities }
  },

  async createPlan(data: CreateHoneymoonPlanInput) {
    const values = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    }
    const [plan] = await db.insert(honeymoonPlans).values(values).returning()
    return plan
  },

  async updatePlan(id: string, weddingId: string, data: UpdateHoneymoonPlanInput) {
    const setData: Record<string, unknown> = {}
    if (data.destination !== undefined) setData.destination = data.destination
    if (data.startDate !== undefined)
      setData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) setData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.budget !== undefined) setData.budget = data.budget
    if (data.notes !== undefined) setData.notes = data.notes
    if (data.packingList !== undefined) setData.packingList = data.packingList
    const [updated] = await db
      .update(honeymoonPlans)
      .set(setData)
      .where(and(eq(honeymoonPlans.id, id), eq(honeymoonPlans.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async deletePlan(id: string, weddingId: string) {
    const [deleted] = await db
      .delete(honeymoonPlans)
      .where(and(eq(honeymoonPlans.id, id), eq(honeymoonPlans.weddingId, weddingId)))
      .returning()
    return deleted ?? null
  },

  async addActivity(data: CreateHoneymoonActivityInput) {
    const [activity] = await db.insert(honeymoonActivities).values(data).returning()
    return activity
  },

  async updateActivity(id: string, weddingId: string, data: UpdateHoneymoonActivityInput) {
    const [act] = await db
      .select({ planId: honeymoonActivities.planId })
      .from(honeymoonActivities)
      .where(eq(honeymoonActivities.id, id))
    if (!act) return null
    const [plan] = await db
      .select({ id: honeymoonPlans.id })
      .from(honeymoonPlans)
      .where(and(eq(honeymoonPlans.id, act.planId), eq(honeymoonPlans.weddingId, weddingId)))
    if (!plan) return null
    const [updated] = await db
      .update(honeymoonActivities)
      .set(data)
      .where(eq(honeymoonActivities.id, id))
      .returning()
    return updated ?? null
  },

  async deleteActivity(id: string, weddingId: string) {
    const [act] = await db
      .select({ planId: honeymoonActivities.planId })
      .from(honeymoonActivities)
      .where(eq(honeymoonActivities.id, id))
    if (!act) return null
    const [plan] = await db
      .select({ id: honeymoonPlans.id })
      .from(honeymoonPlans)
      .where(and(eq(honeymoonPlans.id, act.planId), eq(honeymoonPlans.weddingId, weddingId)))
    if (!plan) return null
    const [deleted] = await db
      .delete(honeymoonActivities)
      .where(eq(honeymoonActivities.id, id))
      .returning()
    return deleted ?? null
  },
}
