import { eq, and, sql, asc, desc } from 'drizzle-orm'
import { db, paymentSchedule, budgetItems } from '@planfortwo/db'
import type { CreatePaymentScheduleInput, UpdatePaymentScheduleInput } from '@planfortwo/validators'
import { activityService } from './activity.js'

function parseRow(row: typeof paymentSchedule.$inferSelect) {
  return {
    ...row,
    amount: parseFloat(row.amount),
  }
}

function parseItemRow(row: typeof budgetItems.$inferSelect) {
  return {
    ...row,
    amount: parseFloat(row.amount),
    paidAmount: parseFloat(row.paidAmount),
  }
}

export const paymentScheduleService = {
  async list(weddingId: string, filter: 'upcoming' | 'overdue' | 'all' = 'all') {
    const conditions: ReturnType<typeof eq>[] = [
      eq(paymentSchedule.weddingId, weddingId),
    ]

    const now = new Date()

    if (filter === 'upcoming') {
      conditions.push(eq(paymentSchedule.isPaid, false))
      conditions.push(sql`${paymentSchedule.dueDate} >= ${now}`)
    } else if (filter === 'overdue') {
      conditions.push(eq(paymentSchedule.isPaid, false))
      conditions.push(sql`${paymentSchedule.dueDate} < ${now}`)
    }

    const rows = await db
      .select({
        payment: paymentSchedule,
        budgetItem: budgetItems,
      })
      .from(paymentSchedule)
      .innerJoin(budgetItems, eq(paymentSchedule.budgetItemId, budgetItems.id))
      .where(and(...conditions))
      .orderBy(asc(paymentSchedule.dueDate))

    return rows.map((r) => ({
      ...parseRow(r.payment),
      budgetItem: parseItemRow(r.budgetItem),
    }))
  },

  async create(data: CreatePaymentScheduleInput, userId: string) {
    const [entry] = await db
      .insert(paymentSchedule)
      .values({
        weddingId: data.weddingId,
        budgetItemId: data.budgetItemId,
        title: data.title,
        amount: data.amount.toString(),
        dueDate: new Date(data.dueDate),
        notes: data.notes ?? null,
      })
      .returning()

    if (entry) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'payment_scheduled',
        entityType: 'payment',
        entityId: entry.id,
        metadata: { title: data.title, amount: data.amount },
      })
    }

    return parseRow(entry!)
  },

  async update(id: string, weddingId: string, data: UpdatePaymentScheduleInput, userId: string) {
    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.amount !== undefined) updateData.amount = data.amount.toString()
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate)
    if (data.notes !== undefined) updateData.notes = data.notes

    if (data.isPaid !== undefined) {
      updateData.isPaid = data.isPaid
      if (data.isPaid && data.paidDate === undefined) {
        updateData.paidDate = new Date()
      }
    }

    if (data.paidDate !== undefined) {
      updateData.paidDate = data.paidDate ? new Date(data.paidDate) : null
    }

    const [updated] = await db
      .update(paymentSchedule)
      .set(updateData)
      .where(and(eq(paymentSchedule.id, id), eq(paymentSchedule.weddingId, weddingId)))
      .returning()

    if (!updated) return null

    // If payment marked as paid, update parent budget item's paidAmount
    if (data.isPaid === true) {
      const paymentAmount = parseFloat(updated.amount)

      const [currentItem] = await db
        .select({ paidAmount: budgetItems.paidAmount })
        .from(budgetItems)
        .where(eq(budgetItems.id, updated.budgetItemId))

      if (currentItem) {
        const newPaidAmount = parseFloat(currentItem.paidAmount) + paymentAmount
        await db
          .update(budgetItems)
          .set({ paidAmount: newPaidAmount.toString() })
          .where(eq(budgetItems.id, updated.budgetItemId))
      }

      await activityService.log({
        weddingId,
        userId,
        action: 'payment_completed',
        entityType: 'payment',
        entityId: id,
        metadata: { title: updated.title, amount: paymentAmount },
      })
    }

    return parseRow(updated)
  },

  async delete(id: string, weddingId: string, userId: string) {
    const [entry] = await db
      .select({ title: paymentSchedule.title })
      .from(paymentSchedule)
      .where(and(eq(paymentSchedule.id, id), eq(paymentSchedule.weddingId, weddingId)))

    if (!entry) {
      throw new Error('Payment schedule entry not found')
    }

    await db
      .delete(paymentSchedule)
      .where(and(eq(paymentSchedule.id, id), eq(paymentSchedule.weddingId, weddingId)))

    await activityService.log({
      weddingId,
      userId,
      action: 'payment_scheduled',
      entityType: 'payment',
      entityId: id,
      metadata: { title: entry.title, deleted: true },
    })
  },

  async getUpcoming(daysAhead: number) {
    const now = new Date()
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    const rows = await db
      .select({
        payment: paymentSchedule,
        budgetItem: budgetItems,
      })
      .from(paymentSchedule)
      .innerJoin(budgetItems, eq(paymentSchedule.budgetItemId, budgetItems.id))
      .where(
        and(
          eq(paymentSchedule.isPaid, false),
          sql`${paymentSchedule.dueDate} >= ${now}`,
          sql`${paymentSchedule.dueDate} <= ${future}`,
        ),
      )
      .orderBy(asc(paymentSchedule.dueDate))

    return rows.map((r) => ({
      ...parseRow(r.payment),
      budgetItem: parseItemRow(r.budgetItem),
    }))
  },
}
