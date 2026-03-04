import { z } from 'zod'

// ── Auth ──
export const createUserSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  avatarUrl: z.string().url().nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ── Wedding ──
export const weddingStyleEnum = z.enum([
  'classic',
  'modern',
  'rustic',
  'romantic',
  'minimalist',
  'bohemian',
  'garden',
  'beach',
  'elegant',
  'whimsical',
])

export const timelineTemplateEnum = z.enum(['6-month', '12-month', '18-month', 'elopement'])

export const createWeddingSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.string().datetime().nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).default('US'),
  guestCountEstimate: z.number().int().min(1).max(2000).nullable().optional(),
  budgetTotal: z.number().min(0).max(10_000_000).nullable().optional(),
  style: weddingStyleEnum.nullable().optional(),
  timelineTemplate: timelineTemplateEnum.default('12-month'),
})

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>

// ── Onboarding ──
export const onboardingSchema = z.object({
  partnerFirstName: z.string().min(1).max(100),
  partnerLastName: z.string().min(1).max(100),
  weddingDate: z.string().datetime().nullable().optional(),
  guestCountEstimate: z.number().int().min(1).max(2000).nullable().optional(),
  budgetTotal: z.number().min(0).max(10_000_000).nullable().optional(),
  style: weddingStyleEnum.nullable().optional(),
  timelineTemplate: timelineTemplateEnum.default('12-month'),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

// ── Partner Invite ──
export const invitePartnerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100).optional(),
})

export type InvitePartnerInput = z.infer<typeof invitePartnerSchema>

// ── Pagination ──
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// ── Common ──
export const idParamSchema = z.object({
  id: z.string().uuid(),
})

// ── Checklist: Task Priority ──
export const taskPriorityZodEnum = z.enum(['must_do', 'nice_to_have', 'optional'])

// ── Checklist: Tasks ──
export const createTaskSchema = z.object({
  weddingId: z.string().uuid(),
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: taskPriorityZodEnum.default('nice_to_have'),
  assignedToUserId: z.string().uuid().nullable().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: taskPriorityZodEnum.optional(),
  categoryId: z.string().uuid().optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export const reorderTaskSchema = z.object({
  sortOrder: z.number().int().min(0),
})

export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>

export const bulkReorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1).max(500),
})

export type BulkReorderTasksInput = z.infer<typeof bulkReorderTasksSchema>

// ── Checklist: Task Notes ──
export const createTaskNoteSchema = z.object({
  content: z.string().min(1).max(5000),
})

export type CreateTaskNoteInput = z.infer<typeof createTaskNoteSchema>

// ── Checklist: Categories ──
export const createCategorySchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  icon: z.string().min(1).max(50),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').optional(),
  icon: z.string().min(1).max(50).optional(),
})

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// ── Checklist: Filters ──
export const taskFiltersSchema = z.object({
  weddingId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  priority: taskPriorityZodEnum.optional(),
  status: z.enum(['all', 'completed', 'incomplete']).default('all'),
  assignedToUserId: z.string().uuid().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'sortOrder', 'createdAt']).default('sortOrder'),
})

export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>

// ── Guest: Dietary Info ──
export const dietaryInfoSchema = z.object({
  vegetarian: z.boolean().optional(),
  vegan: z.boolean().optional(),
  glutenFree: z.boolean().optional(),
  kosher: z.boolean().optional(),
  halal: z.boolean().optional(),
  allergies: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(500).optional(),
}).nullable().optional()

export type DietaryInfoInput = z.infer<typeof dietaryInfoSchema>

// ── Guest: Enums ──
export const rsvpStatusZodEnum = z.enum(['pending', 'accepted', 'declined', 'maybe'])
export const guestSideZodEnum = z.enum(['bride', 'groom', 'both'])

// ── Guest: Create/Update ──
export const createGuestSchema = z.object({
  weddingId: z.string().uuid(),
  householdId: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  side: guestSideZodEnum.nullable().optional(),
  isChild: z.boolean().default(false),
  age: z.number().int().min(0).max(120).nullable().optional(),
  isVip: z.boolean().default(false),
  hasPlusOne: z.boolean().default(false),
  plusOneName: z.string().max(200).nullable().optional(),
  dietary: dietaryInfoSchema,
  mealChoice: z.string().max(100).nullable().optional(),
  tagIds: z.array(z.string().uuid()).max(20).optional(),
})

export type CreateGuestInput = z.infer<typeof createGuestSchema>

export const updateGuestSchema = z.object({
  householdId: z.string().uuid().nullable().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  side: guestSideZodEnum.nullable().optional(),
  isChild: z.boolean().optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  isVip: z.boolean().optional(),
  hasPlusOne: z.boolean().optional(),
  plusOneName: z.string().max(200).nullable().optional(),
  dietary: dietaryInfoSchema,
  mealChoice: z.string().max(100).nullable().optional(),
  rsvpStatus: rsvpStatusZodEnum.optional(),
  songRequest: z.string().max(500).nullable().optional(),
  rsvpNotes: z.string().max(2000).nullable().optional(),
  tagIds: z.array(z.string().uuid()).max(20).optional(),
})

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>

// ── Guest: Filters ──
export const guestFiltersSchema = z.object({
  weddingId: z.string().uuid(),
  search: z.string().max(200).optional(),
  rsvpStatus: rsvpStatusZodEnum.optional(),
  side: guestSideZodEnum.optional(),
  tagId: z.string().uuid().optional(),
  householdId: z.string().uuid().optional(),
  isChild: z.coerce.boolean().optional(),
  isVip: z.coerce.boolean().optional(),
  hasPlusOne: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'rsvpStatus', 'createdAt', 'sortOrder']).default('sortOrder'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export type GuestFiltersInput = z.infer<typeof guestFiltersSchema>

// ── Household: Create/Update ──
export const createHouseholdSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
})

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>

export const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
})

export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>

// ── Guest Tags ──
export const createGuestTagSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
})

export type CreateGuestTagInput = z.infer<typeof createGuestTagSchema>

// ── RSVP: Lookup ──
export const rsvpLookupSchema = z.object({
  token: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
}).refine((d) => d.token || d.code, { message: 'Token or code is required' })

export type RsvpLookupInput = z.infer<typeof rsvpLookupSchema>

export const rsvpNameLookupSchema = z.object({
  weddingId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
})

export type RsvpNameLookupInput = z.infer<typeof rsvpNameLookupSchema>

// ── RSVP: Submit ──
export const rsvpSubmissionSchema = z.object({
  guestId: z.string().uuid(),
  rsvpStatus: rsvpStatusZodEnum,
  mealChoice: z.string().max(100).nullable().optional(),
  dietary: dietaryInfoSchema,
  songRequest: z.string().max(500).nullable().optional(),
  rsvpNotes: z.string().max(2000).nullable().optional(),
  plusOneName: z.string().max(200).nullable().optional(),
  plusOneConfirmed: z.boolean().optional(),
  plusOneMealChoice: z.string().max(100).nullable().optional(),
  plusOneDietary: dietaryInfoSchema,
})

export type RsvpSubmissionInput = z.infer<typeof rsvpSubmissionSchema>

export const rsvpBatchSubmissionSchema = z.object({
  submissions: z.array(rsvpSubmissionSchema).min(1).max(50),
})

export type RsvpBatchSubmissionInput = z.infer<typeof rsvpBatchSubmissionSchema>

// ── CSV Import ──
export const csvImportSchema = z.object({
  weddingId: z.string().uuid(),
})

export type CsvImportInput = z.infer<typeof csvImportSchema>

// ── Budget: Enums ──
export const payerZodEnum = z.enum(['couple', 'bride_family', 'groom_family', 'other'])
export const paymentStatusZodEnum = z.enum(['unpaid', 'deposit', 'partial', 'paid'])

// ── Budget: Categories ──
export const createBudgetCategorySchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  allocatedAmount: z.number().min(0).max(10_000_000).optional(),
})

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>

export const updateBudgetCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').optional(),
  allocatedAmount: z.number().min(0).max(10_000_000).optional(),
})

export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>

// ── Budget: Items ──
export const createBudgetItemSchema = z.object({
  weddingId: z.string().uuid(),
  categoryId: z.string().uuid(),
  vendorName: z.string().max(200).nullable().optional(),
  description: z.string().min(1).max(500),
  amount: z.number().min(0).max(10_000_000),
  paidAmount: z.number().min(0).max(10_000_000).optional(),
  paymentStatus: paymentStatusZodEnum.optional(),
  payer: payerZodEnum.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>

export const updateBudgetItemSchema = z.object({
  categoryId: z.string().uuid().optional(),
  vendorName: z.string().max(200).nullable().optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().min(0).max(10_000_000).optional(),
  paidAmount: z.number().min(0).max(10_000_000).optional(),
  paymentStatus: paymentStatusZodEnum.optional(),
  payer: payerZodEnum.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  paidDate: z.string().datetime().nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
  receiptFileName: z.string().max(255).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>

export const budgetItemFiltersSchema = z.object({
  weddingId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  paymentStatus: paymentStatusZodEnum.optional(),
  payer: payerZodEnum.optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['amount', 'dueDate', 'createdAt', 'sortOrder']).default('sortOrder'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type BudgetItemFiltersInput = z.infer<typeof budgetItemFiltersSchema>

// ── Budget: Payment Schedule ──
export const createPaymentScheduleSchema = z.object({
  weddingId: z.string().uuid(),
  budgetItemId: z.string().uuid(),
  title: z.string().min(1).max(200),
  amount: z.number().min(0).max(10_000_000),
  dueDate: z.string().datetime(),
  notes: z.string().max(2000).nullable().optional(),
})

export type CreatePaymentScheduleInput = z.infer<typeof createPaymentScheduleSchema>

export const updatePaymentScheduleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().min(0).max(10_000_000).optional(),
  dueDate: z.string().datetime().optional(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export type UpdatePaymentScheduleInput = z.infer<typeof updatePaymentScheduleSchema>

// ── Budget: Setup ──
export const budgetSetupSchema = z.object({
  weddingId: z.string().uuid(),
  totalBudget: z.number().min(0).max(10_000_000),
  categoryAllocations: z.array(z.object({
    name: z.string().min(1).max(100),
    icon: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    allocatedAmount: z.number().min(0),
  })).optional(),
})

export type BudgetSetupInput = z.infer<typeof budgetSetupSchema>
