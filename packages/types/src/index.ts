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

// ── Dashboard ──
export interface DashboardData {
  wedding: Wedding
  members: WeddingMember[]
  daysUntilWedding: number | null
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
