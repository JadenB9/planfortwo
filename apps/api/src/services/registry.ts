import { eq, and, asc, desc, sql } from 'drizzle-orm'
import {
  db,
  registryLinks,
  cashFunds,
  cashFundContributions,
  gifts,
  moodBoards,
  moodBoardItems,
} from '@planfortwo/db'
import type {
  CreateRegistryLinkInput,
  CreateCashFundInput,
  UpdateCashFundInput,
  CreateCashFundContributionInput,
  CreateGiftInput,
  UpdateGiftInput,
  CreateMoodBoardInput,
  CreateMoodBoardItemInput,
} from '@planfortwo/validators'

export const registryService = {
  async listLinks(weddingId: string) {
    return db
      .select()
      .from(registryLinks)
      .where(eq(registryLinks.weddingId, weddingId))
      .orderBy(asc(registryLinks.sortOrder))
  },

  async createLink(data: CreateRegistryLinkInput) {
    const [link] = await db
      .insert(registryLinks)
      .values({
        weddingId: data.weddingId,
        storeName: data.storeName,
        url: data.url,
        logoUrl: data.logoUrl,
      })
      .returning()
    return link!
  },

  async deleteLink(linkId: string, weddingId: string) {
    await db
      .delete(registryLinks)
      .where(and(eq(registryLinks.id, linkId), eq(registryLinks.weddingId, weddingId)))
  },

  async trackClick(linkId: string, weddingId: string) {
    await db
      .update(registryLinks)
      .set({ clickCount: sql`${registryLinks.clickCount} + 1` })
      .where(and(eq(registryLinks.id, linkId), eq(registryLinks.weddingId, weddingId)))
  },

  async getFund(fundId: string, weddingId: string) {
    const [fund] = await db
      .select()
      .from(cashFunds)
      .where(and(eq(cashFunds.id, fundId), eq(cashFunds.weddingId, weddingId)))
    return fund ?? null
  },

  async listFunds(weddingId: string) {
    const rows = await db
      .select()
      .from(cashFunds)
      .where(eq(cashFunds.weddingId, weddingId))
      .orderBy(asc(cashFunds.sortOrder))
    return rows.map((r) => ({
      ...r,
      goalAmount: parseFloat(r.goalAmount),
      currentAmount: parseFloat(r.currentAmount),
    }))
  },

  async createFund(data: CreateCashFundInput) {
    const [fund] = await db
      .insert(cashFunds)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        description: data.description,
        goalAmount: data.goalAmount?.toString() ?? '0',
      })
      .returning()
    return {
      ...fund!,
      goalAmount: parseFloat(fund!.goalAmount),
      currentAmount: parseFloat(fund!.currentAmount),
    }
  },

  async updateFund(fundId: string, weddingId: string, data: UpdateCashFundInput) {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.goalAmount !== undefined) updateData.goalAmount = data.goalAmount.toString()
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const [updated] = await db
      .update(cashFunds)
      .set(updateData)
      .where(and(eq(cashFunds.id, fundId), eq(cashFunds.weddingId, weddingId)))
      .returning()
    if (!updated) return null
    return {
      ...updated,
      goalAmount: parseFloat(updated.goalAmount),
      currentAmount: parseFloat(updated.currentAmount),
    }
  },

  async deleteFund(fundId: string, weddingId: string) {
    await db
      .delete(cashFunds)
      .where(and(eq(cashFunds.id, fundId), eq(cashFunds.weddingId, weddingId)))
  },

  async addContribution(data: CreateCashFundContributionInput, weddingId: string) {
    // Verify the fund exists AND belongs to the user's wedding
    const [fund] = await db
      .select({ id: cashFunds.id })
      .from(cashFunds)
      .where(and(eq(cashFunds.id, data.fundId), eq(cashFunds.weddingId, weddingId)))
    if (!fund) {
      throw new Error('Fund not found')
    }

    const result = await db.transaction(async (tx) => {
      const [contribution] = await tx
        .insert(cashFundContributions)
        .values({
          fundId: data.fundId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          amount: data.amount.toString(),
          message: data.message,
          stripePaymentId: data.stripePaymentId,
        })
        .returning()

      await tx
        .update(cashFunds)
        .set({ currentAmount: sql`${cashFunds.currentAmount}::numeric + ${data.amount}` })
        .where(eq(cashFunds.id, data.fundId))

      return contribution!
    })

    return result
  },

  async listGifts(weddingId: string) {
    const rows = await db
      .select()
      .from(gifts)
      .where(eq(gifts.weddingId, weddingId))
      .orderBy(desc(gifts.createdAt))
    return rows.map((r) => ({
      ...r,
      estimatedValue: r.estimatedValue ? parseFloat(r.estimatedValue) : null,
    }))
  },

  async createGift(data: CreateGiftInput) {
    const [gift] = await db
      .insert(gifts)
      .values({
        weddingId: data.weddingId,
        guestName: data.guestName,
        description: data.description,
        estimatedValue: data.estimatedValue?.toString(),
        notes: data.notes,
      })
      .returning()
    return {
      ...gift!,
      estimatedValue: gift!.estimatedValue ? parseFloat(gift!.estimatedValue) : null,
    }
  },

  async updateGift(giftId: string, weddingId: string, data: UpdateGiftInput) {
    const updateData: Record<string, unknown> = {}
    if (data.description !== undefined) updateData.description = data.description
    if (data.thankYouStatus !== undefined) updateData.thankYouStatus = data.thankYouStatus
    if (data.notes !== undefined) updateData.notes = data.notes

    const [updated] = await db
      .update(gifts)
      .set(updateData)
      .where(and(eq(gifts.id, giftId), eq(gifts.weddingId, weddingId)))
      .returning()
    if (!updated) return null
    return {
      ...updated,
      estimatedValue: updated.estimatedValue ? parseFloat(updated.estimatedValue) : null,
    }
  },

  async deleteGift(giftId: string, weddingId: string) {
    await db.delete(gifts).where(and(eq(gifts.id, giftId), eq(gifts.weddingId, weddingId)))
  },

  async listMoodBoards(weddingId: string) {
    return db
      .select()
      .from(moodBoards)
      .where(eq(moodBoards.weddingId, weddingId))
      .orderBy(asc(moodBoards.sortOrder))
  },

  async createMoodBoard(data: CreateMoodBoardInput) {
    const [board] = await db
      .insert(moodBoards)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        description: data.description,
      })
      .returning()
    return board!
  },

  async getMoodBoard(boardId: string, weddingId: string) {
    const [board] = await db
      .select()
      .from(moodBoards)
      .where(and(eq(moodBoards.id, boardId), eq(moodBoards.weddingId, weddingId)))
    return board ?? null
  },

  async deleteMoodBoard(boardId: string, weddingId: string) {
    await db
      .delete(moodBoards)
      .where(and(eq(moodBoards.id, boardId), eq(moodBoards.weddingId, weddingId)))
  },

  async getBoardItem(itemId: string) {
    const [item] = await db.select().from(moodBoardItems).where(eq(moodBoardItems.id, itemId))
    return item ?? null
  },

  async listBoardItems(boardId: string) {
    return db
      .select()
      .from(moodBoardItems)
      .where(eq(moodBoardItems.boardId, boardId))
      .orderBy(asc(moodBoardItems.sortOrder))
  },

  async addBoardItem(data: CreateMoodBoardItemInput) {
    const [item] = await db
      .insert(moodBoardItems)
      .values({
        boardId: data.boardId,
        imageUrl: data.imageUrl,
        r2Key: data.r2Key,
        caption: data.caption,
      })
      .returning()
    return item!
  },

  async deleteBoardItem(itemId: string, weddingId: string) {
    // Verify the item's board belongs to this wedding
    const [item] = await db
      .select({ boardId: moodBoardItems.boardId })
      .from(moodBoardItems)
      .where(eq(moodBoardItems.id, itemId))
    if (!item) return
    const [board] = await db
      .select({ id: moodBoards.id })
      .from(moodBoards)
      .where(and(eq(moodBoards.id, item.boardId), eq(moodBoards.weddingId, weddingId)))
    if (!board) return

    await db.delete(moodBoardItems).where(eq(moodBoardItems.id, itemId))
  },
}
