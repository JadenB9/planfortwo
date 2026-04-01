import { eq, and, asc } from 'drizzle-orm'
import { db, weddingParty, partyTasks, partyGifts } from '@planfortwo/db'
import type {
  CreatePartyMemberInput,
  UpdatePartyMemberInput,
  CreatePartyTaskInput,
  UpdatePartyTaskInput,
  CreatePartyGiftInput,
} from '@planfortwo/validators'
import { activityService } from './activity.js'

export const weddingPartyService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(weddingParty)
      .where(eq(weddingParty.weddingId, weddingId))
      .orderBy(asc(weddingParty.sortOrder))
  },

  async getById(memberId: string, weddingId: string) {
    const [member] = await db
      .select()
      .from(weddingParty)
      .where(and(eq(weddingParty.id, memberId), eq(weddingParty.weddingId, weddingId)))
    return member ?? null
  },

  async create(data: CreatePartyMemberInput, userId: string) {
    const [member] = await db
      .insert(weddingParty)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        role: data.role,
        customRole: data.customRole,
        side: data.side,
        email: data.email,
        phone: data.phone,
        description: data.description,
      })
      .returning()

    if (member) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'party_member_added',
        entityType: 'wedding_party',
        entityId: member.id,
        metadata: { type: 'party_member', name: data.name },
      })
    }

    return member!
  },

  async update(memberId: string, weddingId: string, data: UpdatePartyMemberInput) {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.role !== undefined) updateData.role = data.role
    if (data.customRole !== undefined) updateData.customRole = data.customRole
    if (data.side !== undefined) updateData.side = data.side
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.description !== undefined) updateData.description = data.description
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl
    if (data.outfitDetails !== undefined) updateData.outfitDetails = data.outfitDetails

    const [updated] = await db
      .update(weddingParty)
      .set(updateData)
      .where(and(eq(weddingParty.id, memberId), eq(weddingParty.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async bulkReorder(weddingId: string, updates: { id: string; sortOrder: number }[]) {
    await Promise.all(
      updates.map(({ id, sortOrder }) =>
        db
          .update(weddingParty)
          .set({ sortOrder })
          .where(and(eq(weddingParty.id, id), eq(weddingParty.weddingId, weddingId))),
      ),
    )
  },

  async delete(memberId: string, weddingId: string) {
    const [deleted] = await db
      .delete(weddingParty)
      .where(and(eq(weddingParty.id, memberId), eq(weddingParty.weddingId, weddingId)))
      .returning()
    return !!deleted
  },

  async listTasks(memberId: string) {
    return db
      .select()
      .from(partyTasks)
      .where(eq(partyTasks.memberId, memberId))
      .orderBy(asc(partyTasks.sortOrder))
  },

  async createTask(data: CreatePartyTaskInput) {
    const [task] = await db
      .insert(partyTasks)
      .values({
        memberId: data.memberId,
        weddingId: data.weddingId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      })
      .returning()
    return task!
  },

  async updateTask(taskId: string, weddingId: string, data: UpdatePartyTaskInput) {
    const [_task] = await db
      .select({ weddingId: partyTasks.weddingId })
      .from(partyTasks)
      .where(eq(partyTasks.id, taskId))
    if (!_task || _task.weddingId !== weddingId) return null
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = data.isCompleted
      updateData.completedAt = data.isCompleted ? new Date() : null
    }

    const [updated] = await db
      .update(partyTasks)
      .set(updateData)
      .where(eq(partyTasks.id, taskId))
      .returning()
    return updated ?? null
  },

  async deleteTask(taskId: string, weddingId: string) {
    const [_task] = await db
      .select({ weddingId: partyTasks.weddingId })
      .from(partyTasks)
      .where(eq(partyTasks.id, taskId))
    if (!_task || _task.weddingId !== weddingId) return
    await db.delete(partyTasks).where(eq(partyTasks.id, taskId))
  },

  async listGifts(memberId: string) {
    return db.select().from(partyGifts).where(eq(partyGifts.memberId, memberId))
  },

  async createGift(data: CreatePartyGiftInput) {
    const [gift] = await db
      .insert(partyGifts)
      .values({
        memberId: data.memberId,
        weddingId: data.weddingId,
        title: data.title,
        description: data.description,
        budget: data.budget,
      })
      .returning()
    return gift!
  },

  async deleteGift(giftId: string, weddingId: string) {
    const [_gift] = await db
      .select({ weddingId: partyGifts.weddingId })
      .from(partyGifts)
      .where(eq(partyGifts.id, giftId))
    if (!_gift || _gift.weddingId !== weddingId) return
    await db.delete(partyGifts).where(eq(partyGifts.id, giftId))
  },
}
