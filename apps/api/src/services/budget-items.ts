import { eq, and, asc, desc, ilike, or, sql, count } from 'drizzle-orm'
import { db, budgetCategories, budgetItems } from '@planfortwo/db'
import { storageClient } from '@planfortwo/storage'
import type { CreateBudgetItemInput, UpdateBudgetItemInput, BudgetItemFiltersInput } from '@planfortwo/validators'
import { activityService } from './activity.js'

function parseItemRow(row: typeof budgetItems.$inferSelect) {
  return {
    ...row,
    amount: parseFloat(row.amount),
    paidAmount: parseFloat(row.paidAmount),
  }
}

function parseCategoryRow(row: typeof budgetCategories.$inferSelect) {
  return {
    ...row,
    allocatedAmount: parseFloat(row.allocatedAmount),
  }
}

export const budgetItemService = {
  async list(filters: BudgetItemFiltersInput) {
    const conditions: ReturnType<typeof eq>[] = [
      eq(budgetItems.weddingId, filters.weddingId),
    ]

    if (filters.categoryId) {
      conditions.push(eq(budgetItems.categoryId, filters.categoryId))
    }

    if (filters.paymentStatus) {
      conditions.push(eq(budgetItems.paymentStatus, filters.paymentStatus))
    }

    if (filters.payer) {
      conditions.push(eq(budgetItems.payer, filters.payer))
    }

    if (filters.search) {
      const term = `%${filters.search}%`
      conditions.push(
        or(
          ilike(budgetItems.description, term),
          ilike(budgetItems.vendorName, term),
        )!,
      )
    }

    const [totalResult] = await db
      .select({ cnt: count() })
      .from(budgetItems)
      .where(and(...conditions))

    const total = totalResult?.cnt ?? 0

    const sortMap = {
      amount: desc(budgetItems.amount),
      dueDate: asc(budgetItems.dueDate),
      createdAt: desc(budgetItems.createdAt),
      sortOrder: asc(budgetItems.sortOrder),
    } as const

    const orderBy = sortMap[filters.sortBy ?? 'sortOrder']
    const offset = (filters.page - 1) * filters.pageSize

    const rows = await db
      .select({
        item: budgetItems,
        category: budgetCategories,
      })
      .from(budgetItems)
      .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(filters.pageSize)
      .offset(offset)

    const data = rows.map((r) => ({
      ...parseItemRow(r.item),
      category: parseCategoryRow(r.category),
    }))

    return {
      data,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: offset + rows.length < total,
    }
  },

  async get(id: string, weddingId: string) {
    const [row] = await db
      .select({
        item: budgetItems,
        category: budgetCategories,
      })
      .from(budgetItems)
      .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
      .where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, weddingId)))

    if (!row) return null

    return {
      ...parseItemRow(row.item),
      category: parseCategoryRow(row.category),
    }
  },

  async create(data: CreateBudgetItemInput, userId: string) {
    const [maxOrder] = await db
      .select({ max: sql<number>`coalesce(max(${budgetItems.sortOrder}), -1)` })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, data.weddingId))

    const [item] = await db
      .insert(budgetItems)
      .values({
        weddingId: data.weddingId,
        categoryId: data.categoryId,
        vendorName: data.vendorName ?? null,
        description: data.description,
        amount: data.amount.toString(),
        paidAmount: (data.paidAmount ?? 0).toString(),
        paymentStatus: data.paymentStatus ?? 'unpaid',
        payer: data.payer ?? 'couple',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes ?? null,
        sortOrder: (maxOrder?.max ?? -1) + 1,
      })
      .returning()

    if (item) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'expense_created',
        entityType: 'budget_item',
        entityId: item.id,
        metadata: { description: data.description, amount: data.amount },
      })
    }

    return parseItemRow(item!)
  },

  async update(id: string, weddingId: string, data: UpdateBudgetItemInput, userId: string) {
    const updateData: Record<string, unknown> = {}

    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.vendorName !== undefined) updateData.vendorName = data.vendorName
    if (data.description !== undefined) updateData.description = data.description
    if (data.amount !== undefined) updateData.amount = data.amount.toString()
    if (data.paidAmount !== undefined) updateData.paidAmount = data.paidAmount.toString()
    if (data.payer !== undefined) updateData.payer = data.payer
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.paidDate !== undefined) updateData.paidDate = data.paidDate ? new Date(data.paidDate) : null
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl
    if (data.receiptFileName !== undefined) updateData.receiptFileName = data.receiptFileName
    if (data.notes !== undefined) updateData.notes = data.notes

    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus
      if (data.paymentStatus === 'paid' && data.paidDate === undefined) {
        updateData.paidDate = new Date()
      }
    }

    const [updated] = await db
      .update(budgetItems)
      .set(updateData)
      .where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, weddingId)))
      .returning()

    if (!updated) return null

    await activityService.log({
      weddingId,
      userId,
      action: 'expense_updated',
      entityType: 'budget_item',
      entityId: id,
      metadata: { changes: Object.keys(updateData) },
    })

    return parseItemRow(updated)
  },

  async delete(id: string, weddingId: string, userId: string) {
    const [item] = await db
      .select({ description: budgetItems.description })
      .from(budgetItems)
      .where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, weddingId)))

    if (!item) {
      throw new Error('Budget item not found')
    }

    await db
      .delete(budgetItems)
      .where(and(eq(budgetItems.id, id), eq(budgetItems.weddingId, weddingId)))

    await activityService.log({
      weddingId,
      userId,
      action: 'expense_deleted',
      entityType: 'budget_item',
      entityId: id,
      metadata: { description: item.description },
    })
  },

  async getCount(weddingId: string): Promise<number> {
    const [result] = await db
      .select({ cnt: count() })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))

    return result?.cnt ?? 0
  },

  async getUploadUrl(weddingId: string, itemId: string, fileName: string, contentType: string) {
    const key = storageClient.buildReceiptKey(weddingId, itemId, fileName)
    const uploadUrl = await storageClient.getUploadUrl(key, contentType)
    const receiptUrl = await storageClient.getDownloadUrl(key)

    return { uploadUrl, receiptUrl }
  },
}
