import { eq, and, asc, desc } from 'drizzle-orm'
import { db, vendors, vendorCommunications, vendorContracts } from '@planfortwo/db'
import type {
  CreateVendorInput,
  UpdateVendorInput,
  CreateVendorCommunicationInput,
  CreateVendorContractInput,
  UpdateVendorContractInput,
} from '@planfortwo/validators'
import { activityService } from './activity.js'

export const vendorService = {
  async list(weddingId: string) {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.weddingId, weddingId))
      .orderBy(asc(vendors.sortOrder))
    return rows.map((r) => ({
      ...r,
      cost: r.cost ? parseFloat(r.cost) : null,
      depositAmount: r.depositAmount ? parseFloat(r.depositAmount) : null,
    }))
  },

  async getById(vendorId: string, weddingId: string) {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.id, vendorId), eq(vendors.weddingId, weddingId)))
    if (!vendor) return null
    return {
      ...vendor,
      cost: vendor.cost ? parseFloat(vendor.cost) : null,
      depositAmount: vendor.depositAmount ? parseFloat(vendor.depositAmount) : null,
    }
  },

  async create(data: CreateVendorInput, userId: string) {
    const [vendor] = await db
      .insert(vendors)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        category: data.category,
        status: data.status,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        website: data.website,
        notes: data.notes,
        cost: data.cost?.toString(),
        depositAmount: data.depositAmount?.toString(),
      })
      .returning()

    if (vendor) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'task_created',
        entityType: 'category',
        entityId: vendor.id,
        metadata: { type: 'vendor', name: data.name },
      })
    }

    return {
      ...vendor!,
      cost: vendor!.cost ? parseFloat(vendor!.cost) : null,
      depositAmount: vendor!.depositAmount ? parseFloat(vendor!.depositAmount) : null,
    }
  },

  async update(vendorId: string, weddingId: string, data: UpdateVendorInput) {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.status !== undefined) updateData.status = data.status
    if (data.contactName !== undefined) updateData.contactName = data.contactName
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.website !== undefined) updateData.website = data.website
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.cost !== undefined) updateData.cost = data.cost?.toString()
    if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount?.toString()

    const [updated] = await db
      .update(vendors)
      .set(updateData)
      .where(and(eq(vendors.id, vendorId), eq(vendors.weddingId, weddingId)))
      .returning()

    if (!updated) return null
    return {
      ...updated,
      cost: updated.cost ? parseFloat(updated.cost) : null,
      depositAmount: updated.depositAmount ? parseFloat(updated.depositAmount) : null,
    }
  },

  async delete(vendorId: string, weddingId: string) {
    const [deleted] = await db
      .delete(vendors)
      .where(and(eq(vendors.id, vendorId), eq(vendors.weddingId, weddingId)))
      .returning()
    return !!deleted
  },

  async listCommunications(vendorId: string) {
    return db
      .select()
      .from(vendorCommunications)
      .where(eq(vendorCommunications.vendorId, vendorId))
      .orderBy(desc(vendorCommunications.contactDate))
  },

  async addCommunication(data: CreateVendorCommunicationInput) {
    const [comm] = await db
      .insert(vendorCommunications)
      .values({
        vendorId: data.vendorId,
        type: data.type,
        subject: data.subject,
        content: data.content,
        contactDate: data.contactDate ? new Date(data.contactDate) : new Date(),
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        attachmentUrl: data.attachmentUrl,
        attachmentName: data.attachmentName,
      })
      .returning()
    return comm!
  },

  async deleteCommunication(commId: string) {
    await db.delete(vendorCommunications).where(eq(vendorCommunications.id, commId))
  },

  async listContracts(vendorId: string) {
    return db
      .select()
      .from(vendorContracts)
      .where(eq(vendorContracts.vendorId, vendorId))
      .orderBy(desc(vendorContracts.createdAt))
  },

  async createContract(data: CreateVendorContractInput) {
    const [contract] = await db
      .insert(vendorContracts)
      .values({
        vendorId: data.vendorId,
        title: data.title,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        status: data.status,
        depositDueDate: data.depositDueDate ? new Date(data.depositDueDate) : undefined,
        balanceDueDate: data.balanceDueDate ? new Date(data.balanceDueDate) : undefined,
        cancellationDeadline: data.cancellationDeadline ? new Date(data.cancellationDeadline) : undefined,
        notes: data.notes,
      })
      .returning()
    return contract!
  },

  async updateContract(contractId: string, data: UpdateVendorContractInput) {
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.status !== undefined) updateData.status = data.status
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.depositDueDate !== undefined)
      updateData.depositDueDate = data.depositDueDate ? new Date(data.depositDueDate) : null
    if (data.balanceDueDate !== undefined)
      updateData.balanceDueDate = data.balanceDueDate ? new Date(data.balanceDueDate) : null

    const [updated] = await db
      .update(vendorContracts)
      .set(updateData)
      .where(eq(vendorContracts.id, contractId))
      .returning()
    return updated ?? null
  },

  async deleteContract(contractId: string) {
    await db.delete(vendorContracts).where(eq(vendorContracts.id, contractId))
  },
}
