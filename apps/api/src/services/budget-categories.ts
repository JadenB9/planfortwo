import { eq, and, asc, sql } from 'drizzle-orm'
import { db, budgetCategories, defaultBudgetCategories } from '@planfortwo/db'
import type { CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from '@planfortwo/validators'
import { activityService } from './activity.js'

export const budgetCategoryService = {
  async list(weddingId: string) {
    const rows = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.weddingId, weddingId))
      .orderBy(asc(budgetCategories.sortOrder))

    return rows.map((r) => ({
      ...r,
      allocatedAmount: parseFloat(r.allocatedAmount),
    }))
  },

  async create(data: CreateBudgetCategoryInput, userId: string) {
    const [maxOrder] = await db
      .select({ max: sql<number>`coalesce(max(${budgetCategories.sortOrder}), -1)` })
      .from(budgetCategories)
      .where(eq(budgetCategories.weddingId, data.weddingId))

    const [category] = await db
      .insert(budgetCategories)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        allocatedAmount: (data.allocatedAmount ?? 0).toString(),
        sortOrder: (maxOrder?.max ?? -1) + 1,
      })
      .returning()

    if (category) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'budget_category_created',
        entityType: 'budget_category',
        entityId: category.id,
        metadata: { name: data.name },
      })
    }

    return {
      ...category!,
      allocatedAmount: parseFloat(category!.allocatedAmount),
    }
  },

  async update(id: string, weddingId: string, data: UpdateBudgetCategoryInput) {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.color !== undefined) updateData.color = data.color
    if (data.allocatedAmount !== undefined)
      updateData.allocatedAmount = data.allocatedAmount.toString()

    const [updated] = await db
      .update(budgetCategories)
      .set(updateData)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.weddingId, weddingId)))
      .returning()

    if (!updated) return null

    return {
      ...updated,
      allocatedAmount: parseFloat(updated.allocatedAmount),
    }
  },

  async delete(id: string, weddingId: string, userId: string) {
    const [category] = await db
      .select({ name: budgetCategories.name })
      .from(budgetCategories)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.weddingId, weddingId)))

    if (!category) {
      throw new Error('Category not found')
    }

    await db
      .delete(budgetCategories)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.weddingId, weddingId)))

    await activityService.log({
      weddingId,
      userId,
      action: 'budget_category_deleted',
      entityType: 'budget_category',
      entityId: id,
      metadata: { name: category.name },
    })
  },

  async seedDefaults(weddingId: string, totalBudget?: number, userId?: string) {
    const existing = await db
      .select({ id: budgetCategories.id })
      .from(budgetCategories)
      .where(eq(budgetCategories.weddingId, weddingId))
      .limit(1)

    if (existing.length > 0) return

    const values = defaultBudgetCategories.map((cat, idx) => ({
      weddingId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      allocatedAmount: totalBudget
        ? (Math.round(totalBudget * (cat.allocationPercent / 100) * 100) / 100).toString()
        : '0',
      sortOrder: idx,
      isDefault: true,
    }))

    await db.insert(budgetCategories).values(values)

    if (userId) {
      await activityService.log({
        weddingId,
        userId,
        action: 'budget_category_created',
        entityType: 'budget_category',
        entityId: weddingId,
        metadata: { seeded: true, count: values.length },
      })
    }
  },

  async updateAllocation(id: string, weddingId: string, amount: number) {
    const [updated] = await db
      .update(budgetCategories)
      .set({ allocatedAmount: amount.toString() })
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.weddingId, weddingId)))
      .returning()

    if (!updated) return null

    return {
      ...updated,
      allocatedAmount: parseFloat(updated.allocatedAmount),
    }
  },

  async reorder(weddingId: string, items: { id: string; sortOrder: number }[]) {
    for (const item of items) {
      await db
        .update(budgetCategories)
        .set({ sortOrder: item.sortOrder })
        .where(and(eq(budgetCategories.id, item.id), eq(budgetCategories.weddingId, weddingId)))
    }
  },
}
