// ── Auth & Users ──
export interface User {
  id: string
  clerkId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface WeddingMember {
  id: string
  weddingId: string
  userId: string
  role: WeddingRole
  invitedAt: Date
  joinedAt: Date | null
}

export type WeddingRole = 'owner' | 'partner' | 'planner' | 'family' | 'party_member'

// ── Wedding ──
export interface Wedding {
  id: string
  name: string
  date: Date | null
  venue: string | null
  city: string | null
  state: string | null
  country: string
  guestCountEstimate: number | null
  budgetTotal: number | null
  style: WeddingStyle | null
  timelineTemplate: TimelineTemplate
  websiteSlug: string | null
  websitePublished: boolean
  onboardingCompleted: boolean
  tier: PricingTier
  rsvpDeadline: Date | null
  stripeCustomerId: string | null
  createdAt: Date
  updatedAt: Date
}

export type WeddingStyle =
  | 'classic'
  | 'modern'
  | 'rustic'
  | 'romantic'
  | 'minimalist'
  | 'bohemian'
  | 'garden'
  | 'beach'
  | 'elegant'
  | 'whimsical'

export type TimelineTemplate = '6-month' | '12-month' | '18-month' | 'elopement'

export type PricingTier = 'free' | 'full'

// ── Partner Invitation ──
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface PartnerInvitation {
  id: string
  weddingId: string
  invitedByUserId: string
  email: string
  token: string
  status: InvitationStatus
  createdAt: Date
  expiresAt: Date
}

// ── Onboarding ──
export interface OnboardingData {
  partnerFirstName: string
  partnerLastName: string
  weddingDate: string | null
  guestCountEstimate: number | null
  budgetTotal: number | null
  style: WeddingStyle | null
  timelineTemplate: TimelineTemplate
}

// ── Checklist ──
export type TaskPriority = 'must_do' | 'nice_to_have' | 'optional'

export interface ChecklistCategory {
  id: string
  weddingId: string
  name: string
  color: string
  icon: string
  sortOrder: number
  isDefault: boolean
  createdAt: Date
}

export interface ChecklistTask {
  id: string
  weddingId: string
  categoryId: string
  title: string
  description: string | null
  dueDate: Date | null
  completedAt: Date | null
  completedByUserId: string | null
  assignedToUserId: string | null
  priority: TaskPriority
  sortOrder: number
  isCustom: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaskNote {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: Date
}

export interface TaskAttachment {
  id: string
  taskId: string
  uploadedByUserId: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  createdAt: Date
}

// ── Guest List ──
export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'maybe'

export type GuestSide = 'bride' | 'groom' | 'both'

export interface DietaryInfo {
  vegetarian?: boolean
  vegan?: boolean
  glutenFree?: boolean
  kosher?: boolean
  halal?: boolean
  allergies?: string[]
  notes?: string
}

export interface Guest {
  id: string
  weddingId: string
  householdId: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  rsvpToken: string | null
  rsvpStatus: RsvpStatus
  rsvpRespondedAt: Date | null
  mealChoice: string | null
  dietary: DietaryInfo | null
  songRequest: string | null
  rsvpNotes: string | null
  hasPlusOne: boolean
  plusOneName: string | null
  plusOneConfirmed: boolean
  plusOneMealChoice: string | null
  plusOneDietary: DietaryInfo | null
  isChild: boolean
  age: number | null
  side: GuestSide | null
  isVip: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface GuestTag {
  id: string
  weddingId: string
  name: string
  color: string
  isDefault: boolean
  createdAt: Date
}

export interface GuestTagAssignment {
  id: string
  guestId: string
  tagId: string
  createdAt: Date
}

export interface Household {
  id: string
  weddingId: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  rsvpCode: string | null
  createdAt: Date
}

export interface GuestWithTags extends Guest {
  tags: GuestTag[]
  household: Household | null
}

export interface HouseholdWithGuests extends Household {
  guests: Guest[]
}

// ── RSVP ──
export interface RsvpLookupResult {
  guest: Guest
  household: Household | null
  householdGuests: Guest[]
  weddingName: string
  weddingDate: Date | null
  rsvpDeadline: Date | null
  isExpired: boolean
}

export interface RsvpSubmission {
  guestId: string
  rsvpStatus: RsvpStatus
  mealChoice?: string | null
  dietary?: DietaryInfo | null
  songRequest?: string | null
  rsvpNotes?: string | null
  plusOneName?: string | null
  plusOneConfirmed?: boolean
  plusOneMealChoice?: string | null
  plusOneDietary?: DietaryInfo | null
}

export interface GuestStats {
  totalGuests: number
  adults: number
  children: number
  plusOnes: number
  rsvpAccepted: number
  rsvpDeclined: number
  rsvpPending: number
  rsvpMaybe: number
  confirmedPlusOnes: number
  dietarySummary: DietarySummary
  mealChoiceSummary: Record<string, number>
}

export interface DietarySummary {
  vegetarian: number
  vegan: number
  glutenFree: number
  kosher: number
  halal: number
  withAllergies: number
}

export interface CsvImportResult {
  imported: number
  skipped: number
  errors: string[]
}

// ── Budget ──
export type Payer = 'couple' | 'bride_family' | 'groom_family' | 'other'

export type PaymentStatus = 'unpaid' | 'deposit' | 'partial' | 'paid'

export interface BudgetCategory {
  id: string
  weddingId: string
  name: string
  icon: string
  color: string
  allocatedAmount: number
  sortOrder: number
  isDefault: boolean
  createdAt: Date
}

export interface BudgetItem {
  id: string
  weddingId: string
  categoryId: string
  vendorName: string | null
  description: string
  amount: number
  paidAmount: number
  paymentStatus: PaymentStatus
  payer: Payer
  dueDate: Date | null
  paidDate: Date | null
  receiptUrl: string | null
  receiptFileName: string | null
  notes: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface BudgetItemWithCategory extends BudgetItem {
  category: BudgetCategory
}

export interface PaymentScheduleEntry {
  id: string
  weddingId: string
  budgetItemId: string
  title: string
  amount: number
  dueDate: Date
  paidDate: Date | null
  isPaid: boolean
  reminderSent7d: boolean
  reminderSent1d: boolean
  notes: string | null
  createdAt: Date
}

export interface PaymentScheduleWithItem extends PaymentScheduleEntry {
  budgetItem: BudgetItem
}

export interface BudgetAnalytics {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalPaid: number
  totalUnpaid: number
  burnRate: number
  perGuestCost: number
  projectedTotal: number
  categoryBreakdown: CategoryBreakdown[]
  monthlySpending: MonthlySpending[]
}

export interface CategoryBreakdown {
  categoryId: string
  name: string
  color: string
  allocated: number
  spent: number
  remaining: number
  percentUsed: number
}

export interface MonthlySpending {
  month: string
  amount: number
}

export interface TipSuggestion {
  vendorType: string
  suggestedAmount: number
  suggestedPercent: number
  min: number
  max: number
}

export interface SplitCostSummary {
  couple: { total: number; percentage: number }
  brideFamily: { total: number; percentage: number }
  groomFamily: { total: number; percentage: number }
  other: { total: number; percentage: number }
}

export interface BudgetExportData {
  weddingName: string
  totalBudget: number
  categories: CategoryBreakdown[]
  items: BudgetItemWithCategory[]
  analytics: BudgetAnalytics
}

// ── Activity ──
export type ActivityAction =
  | 'task_created'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_updated'
  | 'task_deleted'
  | 'task_assigned'
  | 'note_added'
  | 'attachment_uploaded'
  | 'category_created'
  | 'category_deleted'
  | 'checklist_seeded'
  | 'guest_created'
  | 'guest_updated'
  | 'guest_deleted'
  | 'guest_imported'
  | 'rsvp_submitted'
  | 'household_created'
  | 'household_deleted'
  | 'budget_category_created'
  | 'budget_category_deleted'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'payment_scheduled'
  | 'payment_completed'

export type EntityType = 'task' | 'category' | 'note' | 'attachment' | 'guest' | 'household' | 'budget_category' | 'budget_item' | 'payment'

export interface ActivityLogEntry {
  id: string
  weddingId: string
  userId: string
  action: ActivityAction
  entityType: EntityType
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

// ── Feature Gating ──
export interface FeatureGates {
  tier: PricingTier
  canAddTasks: boolean
  canEditChecklist: boolean
  canDeleteTasks: boolean
  canReorderTasks: boolean
  canCustomizeCategories: boolean
  canAddNotes: boolean
  canAddAttachments: boolean
  maxGuests: number | null
  canEditGuests: boolean
  canDeleteGuests: boolean
  canBulkImport: boolean
  canRsvp: boolean
  canSeatingChart: boolean
  canVendorManagement: boolean
  canCustomDomain: boolean
  canDataExport: boolean
  canBudgetCategories: boolean
  canBudgetExpenses: boolean
  canBudgetAnalytics: boolean
  canBudgetExport: boolean
  canPaymentSchedule: boolean
}

// ── Dashboard ──
export interface TasksByCategory {
  categoryId: string
  categoryName: string
  color: string
  total: number
  completed: number
}

export interface DashboardStats {
  tasksCompleted: number
  tasksTotal: number
  upcomingTasks: ChecklistTask[]
  recentActivity: ActivityLogEntry[]
  tasksByCategory: TasksByCategory[]
  budgetSpent: number
  budgetTotal: number
}

export interface DashboardData {
  wedding: Wedding
  members: WeddingMember[]
  daysUntilWedding: number | null
  stats?: DashboardStats
}

// ── Composite Types ──
export interface TaskWithDetails extends ChecklistTask {
  category: ChecklistCategory
  notes: TaskNote[]
  attachments: TaskAttachment[]
  assignedUser: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'> | null
}

export interface CategoryWithCount extends ChecklistCategory {
  taskCount: number
  completedCount: number
}

// ── API Responses ──
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  code: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ── Health Check ──
export interface HealthCheck {
  status: 'ok' | 'error'
  timestamp: string
  version: string
  services: {
    database: 'connected' | 'disconnected'
    auth: 'connected' | 'disconnected'
  }
}
