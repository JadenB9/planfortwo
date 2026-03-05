import { z } from 'zod'

export const vendorStatusZodEnum = z.enum([
  'researching',
  'contacted',
  'quoted',
  'booked',
  'paid',
  'completed',
])
export const contractStatusZodEnum = z.enum(['pending', 'signed', 'active', 'completed'])

export const createVendorSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  status: vendorStatusZodEnum.optional(),
  contactName: z.string().max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  cost: z.number().min(0).max(10_000_000).nullable().optional(),
  depositAmount: z.number().min(0).max(10_000_000).nullable().optional(),
})
export type CreateVendorInput = z.infer<typeof createVendorSchema>

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  status: vendorStatusZodEnum.optional(),
  contactName: z.string().max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  cost: z.number().min(0).max(10_000_000).nullable().optional(),
  depositAmount: z.number().min(0).max(10_000_000).nullable().optional(),
})
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>

export const createVendorCommunicationSchema = z.object({
  vendorId: z.string().uuid(),
  type: z.string().min(1).max(50).optional(),
  subject: z.string().max(200).nullable().optional(),
  content: z.string().min(1).max(5000),
  contactDate: z.string().datetime().optional(),
  followUpDate: z.string().datetime().nullable().optional(),
  attachmentUrl: z.string().url().nullable().optional(),
  attachmentName: z.string().max(255).nullable().optional(),
})
export type CreateVendorCommunicationInput = z.infer<typeof createVendorCommunicationSchema>

export const createVendorContractSchema = z.object({
  vendorId: z.string().uuid(),
  title: z.string().min(1).max(200),
  fileUrl: z.string().url().nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
  status: contractStatusZodEnum.optional(),
  depositDueDate: z.string().datetime().nullable().optional(),
  balanceDueDate: z.string().datetime().nullable().optional(),
  cancellationDeadline: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})
export type CreateVendorContractInput = z.infer<typeof createVendorContractSchema>

export const updateVendorContractSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: contractStatusZodEnum.optional(),
  fileUrl: z.string().url().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  depositDueDate: z.string().datetime().nullable().optional(),
  balanceDueDate: z.string().datetime().nullable().optional(),
})
export type UpdateVendorContractInput = z.infer<typeof updateVendorContractSchema>
