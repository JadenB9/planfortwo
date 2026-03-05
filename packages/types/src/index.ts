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

// ── Website Builder ──
export type PrivacyMode = 'public' | 'password' | 'unlisted'

export type WebsiteSectionType =
  | 'hero'
  | 'our_story'
  | 'event_details'
  | 'wedding_party'
  | 'gallery'
  | 'travel'
  | 'things_to_do'
  | 'registry'
  | 'faq'
  | 'rsvp'
  | 'schedule'
  | 'guestbook'
  | 'custom'

export type FontPair =
  | 'playfair-lato'
  | 'cormorant-fira'
  | 'great-vibes-montserrat'
  | 'josefin-open-sans'
  | 'libre-baskerville-source-sans'
  | 'dancing-script-nunito'

export interface CustomColors {
  primary: string
  secondary: string
  accent: string
  background: string
}

export interface WebsiteConfig {
  id: string
  weddingId: string
  templateId: string
  customColors: CustomColors | null
  fontPair: string
  privacyMode: PrivacyMode
  passwordHash: string | null
  subdomain: string | null
  customDomain: string | null
  domainVerified: boolean
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  hashtag: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface WebsiteSection {
  id: string
  weddingId: string
  sectionType: WebsiteSectionType
  title: string
  content: Record<string, unknown>
  isVisible: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface WebsitePhoto {
  id: string
  weddingId: string
  sectionId: string | null
  r2Key: string
  url: string
  fileName: string
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null
  altText: string | null
  sortOrder: number
  createdAt: Date
}

export interface GuestbookEntry {
  id: string
  weddingId: string
  authorName: string
  message: string
  isApproved: boolean
  isVisible: boolean
  createdAt: Date
}

// ── Section Content Interfaces ──
export interface HeroContent {
  headline: string
  subheadline: string
  backgroundImageUrl: string | null
  showDate: boolean
  showCountdown: boolean
}

export interface OurStoryContent {
  body: string
  timelineEvents: {
    date: string
    title: string
    description: string
    imageUrl?: string
  }[]
}

export interface EventDetailsContent {
  events: {
    name: string
    date: string | null
    time: string | null
    venue: string
    address: string
    description: string
  }[]
}

export interface WeddingPartyContent {
  members: {
    name: string
    role: string
    imageUrl?: string
    description?: string
  }[]
}

export interface GalleryContent {
  layout: 'grid' | 'masonry' | 'slideshow'
  columns: number
}

export interface TravelContent {
  accommodations: {
    name: string
    url?: string
    address?: string
    phone?: string
    notes?: string
    bookingCode?: string
  }[]
  directions: string
  mapEmbed: string | null
}

export interface ThingsToDoContent {
  activities: {
    name: string
    description?: string
    url?: string
    category?: string
  }[]
}

export interface RegistryContent {
  message: string
  registries: {
    name: string
    url: string
    logoUrl?: string
  }[]
}

export interface FaqContent {
  questions: {
    question: string
    answer: string
  }[]
}

export interface RsvpSectionContent {
  message: string
  showMealChoice: boolean
  showDietary: boolean
  showSongRequest: boolean
}

export interface ScheduleContent {
  items: {
    time: string
    title: string
    description?: string
    location?: string
  }[]
}

export interface GuestbookSectionContent {
  requireApproval: boolean
  message: string
}

export interface CustomSectionContent {
  slug?: string
  body: string
}

export interface WebsiteWithSections extends WebsiteConfig {
  sections: WebsiteSection[]
  photos: WebsitePhoto[]
  weddingName: string
  weddingDate: Date | null
}

export interface WebsiteAnalyticsSummary {
  totalViews: number
  uniqueVisitors: number
  viewsByDay: { date: string; count: number }[]
  viewsBySection: { section: string; count: number }[]
  viewsByCountry: { country: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
}

// ── Post-Wedding ──
export type ThankYouStatus = 'not_started' | 'drafted' | 'sent'

export interface ThankYouNote {
  id: string
  weddingId: string
  guestId: string | null
  giftId: string | null
  recipientName: string
  recipientEmail: string | null
  recipientAddress: string | null
  message: string | null
  status: ThankYouStatus
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NameChangeTask {
  id: string
  weddingId: string
  institution: string
  description: string | null
  documentsRequired: string | null
  isCompleted: boolean
  completedAt: Date | null
  sortOrder: number
  createdAt: Date
}

export interface VendorReview {
  id: string
  weddingId: string
  vendorId: string
  rating: number
  reviewText: string | null
  isPublished: boolean
  createdAt: Date
}

export interface NotificationPreference {
  id: string
  userId: string
  weddingId: string
  emailRsvp: boolean
  emailPaymentReminder: boolean
  emailTaskDue: boolean
  emailWeeklySummary: boolean
  digestFrequency: string
  createdAt: Date
  updatedAt: Date
}

// ── Payments & Growth ──
export type PurchaseStatus = 'pending' | 'completed' | 'refunded' | 'failed'

export interface Purchase {
  id: string
  weddingId: string
  userId: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  amount: string
  currency: string
  status: PurchaseStatus
  completedAt: Date | null
  createdAt: Date
}

export interface Referral {
  id: string
  referrerUserId: string
  referralCode: string
  referredEmail: string | null
  referredUserId: string | null
  isConverted: boolean
  convertedAt: Date | null
  rewardGranted: boolean
  createdAt: Date
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: Date
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
  | 'website_created'
  | 'website_published'
  | 'website_unpublished'
  | 'website_section_updated'
  | 'website_template_changed'
  | 'guestbook_entry_created'

export type EntityType = 'task' | 'category' | 'note' | 'attachment' | 'guest' | 'household' | 'budget_category' | 'budget_item' | 'payment' | 'website' | 'website_section' | 'guestbook_entry'

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
  canWebsiteBuilder: boolean
  canWebsiteAnalytics: boolean
  canWebsiteCustomSections: boolean
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

// ── Seating Chart ──
export type SeatingChartStatus = 'draft' | 'final'
export type TableShape = 'round' | 'rectangle' | 'square' | 'oval' | 'custom'

export interface SeatingChart {
  id: string
  weddingId: string
  name: string
  status: SeatingChartStatus
  venueWidth: number | null
  venueHeight: number | null
  createdAt: Date
  updatedAt: Date
}

export interface SeatingTable {
  id: string
  chartId: string
  label: string
  shape: TableShape
  capacity: number
  posX: number
  posY: number
  rotation: number
  createdAt: Date
}

export interface SeatingAssignment {
  id: string
  tableId: string
  guestId: string
  seatNumber: number | null
  createdAt: Date
}

export interface SeatingTableWithAssignments extends SeatingTable {
  assignments: SeatingAssignment[]
}

export interface SeatingChartWithTables extends SeatingChart {
  tables: SeatingTableWithAssignments[]
}

// ── Vendors ──
export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'dj'
  | 'band'
  | 'florist'
  | 'cake'
  | 'officiant'
  | 'hair_makeup'
  | 'transportation'
  | 'stationery'
  | 'rentals'
  | 'lighting'
  | 'planner'
  | 'other'

export type VendorStatus = 'researching' | 'contacted' | 'booked' | 'confirmed' | 'declined'

export interface Vendor {
  id: string
  weddingId: string
  name: string
  category: VendorCategory
  status: VendorStatus
  contactName: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  cost: number | null
  depositPaid: number | null
  notes: string | null
  rating: number | null
  createdAt: Date
  updatedAt: Date
}

export interface VendorCommunication {
  id: string
  vendorId: string
  type: string
  subject: string | null
  body: string | null
  date: Date
  createdAt: Date
}

// ── Events ──
export type EventType = 'ceremony' | 'reception' | 'rehearsal_dinner' | 'bridal_shower' | 'bachelor_party' | 'bachelorette_party' | 'engagement_party' | 'brunch' | 'other'

export interface WeddingEvent {
  id: string
  weddingId: string
  name: string
  type: EventType
  date: Date | null
  startTime: string | null
  endTime: string | null
  venue: string | null
  address: string | null
  description: string | null
  dressCode: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface TimelineEntry {
  id: string
  eventId: string
  time: string
  title: string
  description: string | null
  duration: number | null
  sortOrder: number
  createdAt: Date
}

// ── Photo Gallery ──
export type PhotoModerationStatus = 'pending' | 'approved' | 'rejected'

export interface GalleryPhoto {
  id: string
  weddingId: string
  uploadedBy: string | null
  url: string
  thumbnailUrl: string | null
  caption: string | null
  isFavorite: boolean
  moderationStatus: PhotoModerationStatus
  sortOrder: number
  createdAt: Date
}

// ── Registry ──
export interface RegistryLink {
  id: string
  weddingId: string
  storeName: string
  url: string
  logoUrl: string | null
  sortOrder: number
  clickCount: number
  createdAt: Date
}

export interface CashFund {
  id: string
  weddingId: string
  name: string
  description: string | null
  goalAmount: number
  currentAmount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CashFundContribution {
  id: string
  fundId: string
  guestName: string
  amount: number
  message: string | null
  createdAt: Date
}

export interface Gift {
  id: string
  weddingId: string
  guestName: string | null
  description: string
  estimatedValue: number | null
  thankYouStatus: ThankYouStatus
  thankYouSentAt: Date | null
  receivedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
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
