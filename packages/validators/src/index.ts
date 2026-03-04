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

// ── Website: Enums ──
export const privacyModeZodEnum = z.enum(['public', 'password', 'unlisted'])
export const websiteSectionTypeZodEnum = z.enum([
  'hero', 'our_story', 'event_details', 'wedding_party', 'gallery',
  'travel', 'things_to_do', 'registry', 'faq', 'rsvp', 'schedule',
  'guestbook', 'custom',
])
export const fontPairZodEnum = z.enum([
  'playfair-lato', 'cormorant-fira', 'great-vibes-montserrat',
  'josefin-open-sans', 'libre-baskerville-source-sans', 'dancing-script-nunito',
])
export const templateIdZodEnum = z.enum([
  'classic', 'modern', 'rustic', 'romantic', 'minimalist',
  'bohemian', 'garden', 'beach', 'elegant', 'whimsical',
])

// ── Website: Custom Colors ──
const hexColorRegex = /^#[0-9a-fA-F]{6}$/
export const customColorsSchema = z.object({
  primary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  secondary: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  accent: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
  background: z.string().regex(hexColorRegex, 'Must be a valid hex color'),
})

export type CustomColorsInput = z.infer<typeof customColorsSchema>

// ── Website: Subdomain ──
export const subdomainSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Lowercase alphanumeric and hyphens only, cannot start or end with a hyphen')

// ── Website: Config ──
export const createWebsiteConfigSchema = z.object({
  weddingId: z.string().uuid(),
  templateId: templateIdZodEnum.default('classic'),
  subdomain: subdomainSchema,
})

export type CreateWebsiteConfigInput = z.infer<typeof createWebsiteConfigSchema>

export const updateWebsiteConfigSchema = z.object({
  templateId: templateIdZodEnum.optional(),
  customColors: customColorsSchema.nullable().optional(),
  fontPair: fontPairZodEnum.optional(),
  privacyMode: privacyModeZodEnum.optional(),
  subdomain: subdomainSchema.optional(),
  customDomain: z.string().max(253).nullable().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  ogImageUrl: z.string().url().nullable().optional(),
  hashtag: z.string().max(100).nullable().optional(),
})

export type UpdateWebsiteConfigInput = z.infer<typeof updateWebsiteConfigSchema>

// ── Website: Sections ──
export const updateWebsiteSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.unknown()).optional(),
  isVisible: z.boolean().optional(),
})

export type UpdateWebsiteSectionInput = z.infer<typeof updateWebsiteSectionSchema>

export const reorderWebsiteSectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1).max(20),
})

export type ReorderWebsiteSectionsInput = z.infer<typeof reorderWebsiteSectionsSchema>

export const createCustomSectionSchema = z.object({
  weddingId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.record(z.unknown()).optional(),
})

export type CreateCustomSectionInput = z.infer<typeof createCustomSectionSchema>

// ── Website: Photos ──
export const requestPhotoUploadSchema = z.object({
  weddingId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\/(jpeg|png|gif|webp|svg\+xml)$/, 'Must be a valid image type'),
  fileSize: z.number().int().min(1).max(20_000_000),
  sectionId: z.string().uuid().nullable().optional(),
})

export type RequestPhotoUploadInput = z.infer<typeof requestPhotoUploadSchema>

export const registerPhotoSchema = z.object({
  weddingId: z.string().uuid(),
  sectionId: z.string().uuid().nullable().optional(),
  r2Key: z.string().min(1),
  url: z.string().url(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSize: z.number().int().min(1),
  width: z.number().int().min(1).nullable().optional(),
  height: z.number().int().min(1).nullable().optional(),
  altText: z.string().max(500).nullable().optional(),
})

export type RegisterPhotoInput = z.infer<typeof registerPhotoSchema>

export const reorderPhotosSchema = z.object({
  photos: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1).max(200),
})

export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>

// ── Website: Password ──
export const websitePasswordSchema = z.object({
  password: z.string().min(4).max(100),
})

export type WebsitePasswordInput = z.infer<typeof websitePasswordSchema>

export const verifyWebsitePasswordSchema = z.object({
  password: z.string().min(1),
})

export type VerifyWebsitePasswordInput = z.infer<typeof verifyWebsitePasswordSchema>

// ── Guestbook ──
export const createGuestbookEntrySchema = z.object({
  weddingId: z.string().uuid(),
  authorName: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
})

export type CreateGuestbookEntryInput = z.infer<typeof createGuestbookEntrySchema>

// ── Website: Analytics Track ──
export const trackPageViewSchema = z.object({
  path: z.string().max(500).default('/'),
  sectionViewed: z.string().max(100).nullable().optional(),
  referrer: z.string().max(2000).nullable().optional(),
})

export type TrackPageViewInput = z.infer<typeof trackPageViewSchema>

// Phase 6: Seating Charts
export * from './seating-charts'

// Phase 7: Email Campaigns
export * from './email-campaigns'

// Phase 8: Vendors, Wedding Party, Events
export * from './vendors'
export * from './wedding-party'
export * from './events'

// Phase 9: Photos, Registry, Design
export * from './photos'
export * from './registry'
