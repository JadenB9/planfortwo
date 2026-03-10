import type {
  User,
  Wedding,
  DashboardData,
  PartnerInvitation,
  OnboardingData,
  ChecklistTask,
  ChecklistCategory,
  CategoryWithCount,
  TaskWithDetails,
  TaskNote,
  DashboardStats,
  ActivityLogEntry,
  FeatureGates,
  GuestWithTags,
  GuestStats,
  Household,
  GuestTag,
  CsvImportResult,
  Guest,
  BudgetCategory,
  BudgetItem,
  BudgetItemWithCategory,
  PaginatedResponse,
  PaymentScheduleEntry,
  PaymentScheduleWithItem,
  BudgetAnalytics,
  TipSuggestion,
  SplitCostSummary,
  WebsiteConfig,
  WebsiteSection,
  WebsitePhoto,
  GuestbookEntry,
  WebsiteAnalyticsSummary,
  WebsiteWithSections,
  NotificationPreference,
  SeatingChart,
  SeatingChartWithTables,
  SeatingTable,
  SeatingAssignment,
  Vendor,
  VendorCommunication,
  WeddingEvent,
  TimelineEntry,
  GalleryPhoto,
  RegistryLink,
  CashFund,
  CashFundContribution,
  Gift,
  PlanningProgress,
  Email,
  EmailAddress,
  Prayer,
} from '@planfortwo/types'
import type {
  CreateTaskInput,
  UpdateTaskInput,
  BulkReorderTasksInput,
  CreateTaskNoteInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateGuestInput,
  UpdateGuestInput,
  CreateHouseholdInput,
  UpdateHouseholdInput,
  CreateGuestTagInput,
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
  CreateBudgetItemInput,
  UpdateBudgetItemInput,
  BudgetItemFiltersInput,
  CreatePaymentScheduleInput,
  UpdatePaymentScheduleInput,
  CreateWebsiteConfigInput,
  UpdateWebsiteConfigInput,
  UpdateWebsiteSectionInput,
  ReorderWebsiteSectionsInput,
  CreateCustomSectionInput,
  RequestPhotoUploadInput,
  RegisterPhotoInput,
  ReorderPhotosInput,
  WebsitePasswordInput,
  VerifyWebsitePasswordInput,
  TrackPageViewInput,
  CreateGuestbookEntryInput,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  CreatePlaylistSongInput,
  CreateHoneymoonPlanInput,
  UpdateHoneymoonPlanInput,
  CreateHoneymoonActivityInput,
  UpdateHoneymoonActivityInput,
  CreateEmailCampaignInput,
  UpdateEmailCampaignInput,
  UpdateNotificationPreferencesInput,
  ClaimAddressInput,
  ComposeEmailInput,
  UpdateEmailInput,
  InboxFiltersInput,
} from '@planfortwo/validators'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function fetchApi<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

export const api = {
  users: {
    me: (token: string) => fetchApi<{ data: User }>('/users/me', { token }),
  },
  weddings: {
    mine: (token: string) => fetchApi<{ data: DashboardData }>('/weddings/mine', { token }),
    update: (weddingId: string, data: Record<string, unknown>, token: string) =>
      fetchApi<{ data: Wedding }>(`/weddings/${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    completeOnboarding: (weddingId: string, data: OnboardingData, token: string) =>
      fetchApi<{ data: Wedding }>(`/weddings/${weddingId}/onboarding`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    invitePartner: (weddingId: string, data: { email: string }, token: string) =>
      fetchApi<{ data: PartnerInvitation }>(`/weddings/${weddingId}/invite-partner`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    acceptInvite: (inviteToken: string, authToken: string) =>
      fetchApi<{ data: Wedding }>(`/weddings/accept-invite/${inviteToken}`, {
        method: 'POST',
        token: authToken,
      }),
    getPendingInvitations: (weddingId: string, token: string) =>
      fetchApi<{ data: PartnerInvitation[] }>(`/weddings/${weddingId}/pending-invitations`, {
        token,
      }),
    cancelInvitation: (weddingId: string, invitationId: string, token: string) =>
      fetchApi<{ data: { cancelled: boolean } }>(
        `/weddings/${weddingId}/invitations/${invitationId}`,
        {
          method: 'DELETE',
          token,
        },
      ),
    resendInvitation: (weddingId: string, invitationId: string, token: string) =>
      fetchApi<{ data: { resent: boolean } }>(
        `/weddings/${weddingId}/invitations/${invitationId}/resend`,
        {
          method: 'POST',
          token,
        },
      ),
    getMembers: (weddingId: string, token: string) =>
      fetchApi<{
        data: Array<{
          member: { id: string; role: string }
          user: {
            id: string
            email: string
            firstName: string
            lastName: string
            avatarUrl: string | null
          }
        }>
      }>(`/weddings/${weddingId}/members`, { token }),
    addMember: (weddingId: string, data: { email: string; role: string }, token: string) =>
      fetchApi<{
        data: {
          member?: { id: string; role: string }
          user?: { id: string; email: string; firstName: string; lastName: string }
          invited?: boolean
          message?: string
        }
      }>(`/weddings/${weddingId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    removeMember: (weddingId: string, memberId: string, token: string) =>
      fetchApi<{ data: { removed: boolean } }>(`/weddings/${weddingId}/members/${memberId}`, {
        method: 'DELETE',
        token,
      }),
  },
  tasks: {
    list: (
      weddingId: string,
      token: string,
      params?: {
        categoryId?: string
        priority?: string
        status?: string
        assignedToUserId?: string
        sortBy?: string
      },
    ) => {
      const searchParams = new URLSearchParams({ weddingId })
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) searchParams.set(k, v)
        })
      }
      return fetchApi<{ data: ChecklistTask[] }>(`/tasks?${searchParams}`, { token })
    },
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: TaskWithDetails }>(`/tasks/${id}?weddingId=${weddingId}`, { token }),
    create: (data: CreateTaskInput, token: string) =>
      fetchApi<{ data: ChecklistTask }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, data: UpdateTaskInput, weddingId: string, token: string) =>
      fetchApi<{ data: ChecklistTask }>(`/tasks/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    toggleComplete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: ChecklistTask }>(`/tasks/${id}/complete?weddingId=${weddingId}`, {
        method: 'PATCH',
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/tasks/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
    reorder: (id: string, sortOrder: number, weddingId: string, token: string) =>
      fetchApi<{ data: ChecklistTask }>(`/tasks/${id}/reorder?weddingId=${weddingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sortOrder }),
        token,
      }),
    bulkReorder: (data: BulkReorderTasksInput, weddingId: string, token: string) =>
      fetchApi<void>(`/tasks/bulk-reorder?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    addNote: (taskId: string, data: CreateTaskNoteInput, weddingId: string, token: string) =>
      fetchApi<{ data: TaskNote }>(`/tasks/${taskId}/notes?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },
  categories: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: CategoryWithCount[] }>(`/categories?weddingId=${weddingId}`, { token }),
    create: (data: CreateCategoryInput, token: string) =>
      fetchApi<{ data: ChecklistCategory }>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, data: UpdateCategoryInput, weddingId: string, token: string) =>
      fetchApi<{ data: ChecklistCategory }>(`/categories/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/categories/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  dashboard: {
    stats: (weddingId: string, token: string) =>
      fetchApi<{ data: DashboardStats }>(`/dashboard/stats?weddingId=${weddingId}`, { token }),
  },
  activity: {
    list: (weddingId: string, token: string, limit = 20) =>
      fetchApi<{ data: ActivityLogEntry[] }>(`/activity?weddingId=${weddingId}&limit=${limit}`, {
        token,
      }),
  },
  features: {
    get: (weddingId: string, token: string) =>
      fetchApi<{ data: FeatureGates }>(`/features?weddingId=${weddingId}`, { token }),
  },
  purchases: {
    checkout: (weddingId: string, token: string) =>
      fetchApi<{ data: { url: string } }>(`/purchases/checkout?weddingId=${weddingId}`, {
        method: 'POST',
        token,
      }),
    redeemPromo: (weddingId: string, promoCode: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/purchases/redeem-promo?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify({ weddingId, promoCode }),
        token,
      }),
  },
  guests: {
    list: (weddingId: string, token: string, filters?: object) => {
      const searchParams = new URLSearchParams({ weddingId })
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v))
        }
      }
      return fetchApi<{
        data: GuestWithTags[]
        total: number
        page: number
        pageSize: number
        hasMore: boolean
      }>(`/guests?${searchParams}`, { token })
    },
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: GuestWithTags }>(`/guests/${id}?weddingId=${weddingId}`, { token }),
    create: (data: CreateGuestInput, token: string) =>
      fetchApi<{ data: Guest }>('/guests', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: UpdateGuestInput, weddingId: string, token: string) =>
      fetchApi<{ data: Guest }>(`/guests/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/guests/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
    stats: (weddingId: string, token: string) =>
      fetchApi<{ data: GuestStats }>(`/guests/stats?weddingId=${weddingId}`, { token }),
    exportCsv: async (weddingId: string, token: string) => {
      const res = await fetch(`${API_URL}/guests/export?weddingId=${weddingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      return res.text()
    },
    bulkImport: async (weddingId: string, file: File, token: string) => {
      const csvContent = await file.text()
      return fetchApi<{ data: CsvImportResult }>('/guests/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ weddingId, csvContent }),
        token,
      })
    },
    sendInvite: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/guests/${id}/send-invite?weddingId=${weddingId}`, {
        method: 'POST',
        token,
      }),
    sendInvites: (weddingId: string, token: string, guestIds?: string[]) =>
      fetchApi<{ data: { sent: number; failed: number; total: number } }>('/guests/send-invites', {
        method: 'POST',
        body: JSON.stringify({ weddingId, guestIds }),
        token,
      }),
  },
  households: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: Household[] }>(`/households?weddingId=${weddingId}`, { token }),
    create: (data: CreateHouseholdInput, token: string) =>
      fetchApi<{ data: Household }>('/households', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, data: UpdateHouseholdInput, weddingId: string, token: string) =>
      fetchApi<{ data: Household }>(`/households/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/households/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  guestTags: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: GuestTag[] }>(`/guest-tags?weddingId=${weddingId}`, { token }),
    create: (data: CreateGuestTagInput, token: string) =>
      fetchApi<{ data: GuestTag }>('/guest-tags', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/guest-tags/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  budgetCategories: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: BudgetCategory[] }>(`/budget-categories?weddingId=${weddingId}`, { token }),
    create: (data: CreateBudgetCategoryInput, token: string) =>
      fetchApi<{ data: BudgetCategory }>('/budget-categories', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdateBudgetCategoryInput, token: string) =>
      fetchApi<{ data: BudgetCategory }>(`/budget-categories/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/budget-categories/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    seedDefaults: (weddingId: string, totalBudget: number | undefined, token: string) =>
      fetchApi<{ data: { success: boolean } }>('/budget-categories/seed-defaults', {
        method: 'POST',
        body: JSON.stringify({ weddingId, totalBudget }),
        token,
      }),
  },
  budgetItems: {
    list: (filters: BudgetItemFiltersInput, token: string) => {
      const searchParams = new URLSearchParams()
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v))
      }
      return fetchApi<PaginatedResponse<BudgetItemWithCategory>>(`/budget-items?${searchParams}`, {
        token,
      })
    },
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: BudgetItemWithCategory }>(`/budget-items/${id}?weddingId=${weddingId}`, {
        token,
      }),
    create: (data: CreateBudgetItemInput, token: string) =>
      fetchApi<{ data: BudgetItem }>('/budget-items', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdateBudgetItemInput, token: string) =>
      fetchApi<{ data: BudgetItem }>(`/budget-items/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/budget-items/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
    getUploadUrl: (
      id: string,
      weddingId: string,
      fileName: string,
      contentType: string,
      token: string,
    ) =>
      fetchApi<{ data: { uploadUrl: string; receiptUrl: string } }>(
        `/budget-items/${id}/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({ weddingId, fileName, contentType }),
          token,
        },
      ),
  },
  paymentSchedule: {
    list: (weddingId: string, token: string, filter: string = 'all') =>
      fetchApi<{ data: PaymentScheduleWithItem[] }>(
        `/payment-schedule?weddingId=${weddingId}&filter=${filter}`,
        { token },
      ),
    create: (data: CreatePaymentScheduleInput, token: string) =>
      fetchApi<{ data: PaymentScheduleEntry }>('/payment-schedule', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdatePaymentScheduleInput, token: string) =>
      fetchApi<{ data: PaymentScheduleEntry }>(`/payment-schedule/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/payment-schedule/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  budgetAnalytics: {
    getAnalytics: (weddingId: string, token: string) =>
      fetchApi<{ data: BudgetAnalytics }>(`/budget/analytics?weddingId=${weddingId}`, { token }),
    getTips: (weddingId: string, token: string) =>
      fetchApi<{ data: TipSuggestion[] }>(`/budget/tips?weddingId=${weddingId}`, { token }),
    getSplits: (weddingId: string, token: string) =>
      fetchApi<{ data: SplitCostSummary }>(`/budget/splits?weddingId=${weddingId}`, { token }),
    exportCsv: async (weddingId: string, token: string) => {
      const res = await fetch(`${API_URL}/budget/export/csv?weddingId=${weddingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      return res.text()
    },
    exportPdf: async (weddingId: string, token: string) => {
      const res = await fetch(`${API_URL}/budget/export/pdf?weddingId=${weddingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      return res.blob()
    },
  },
  websiteConfig: {
    get: (weddingId: string, token: string) =>
      fetchApi<{ data: WebsiteConfig | null }>(`/website-config?weddingId=${weddingId}`, { token }),
    create: (data: CreateWebsiteConfigInput, token: string) =>
      fetchApi<{ data: WebsiteConfig }>('/website-config', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdateWebsiteConfigInput, token: string) =>
      fetchApi<{ data: WebsiteConfig }>(`/website-config/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    publish: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: WebsiteConfig }>(`/website-config/${id}/publish?weddingId=${weddingId}`, {
        method: 'POST',
        token,
      }),
    unpublish: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: WebsiteConfig }>(`/website-config/${id}/unpublish?weddingId=${weddingId}`, {
        method: 'POST',
        token,
      }),
    setPassword: (id: string, weddingId: string, data: WebsitePasswordInput, token: string) =>
      fetchApi<{ data: { success: boolean } }>(
        `/website-config/${id}/set-password?weddingId=${weddingId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        },
      ),
    checkSubdomain: (subdomain: string, token: string, weddingId?: string) =>
      fetchApi<{ data: { available: boolean; reason?: string } }>(
        `/website-config/check-subdomain?subdomain=${encodeURIComponent(subdomain)}${weddingId ? `&weddingId=${encodeURIComponent(weddingId)}` : ''}`,
        {
          token,
        },
      ),
  },
  websiteSections: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: WebsiteSection[] }>(`/website-sections?weddingId=${weddingId}`, { token }),
    update: (id: string, weddingId: string, data: UpdateWebsiteSectionInput, token: string) =>
      fetchApi<{ data: WebsiteSection }>(`/website-sections/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    reorder: (weddingId: string, data: ReorderWebsiteSectionsInput, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/website-sections/reorder?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    createCustom: (data: CreateCustomSectionInput, token: string) =>
      fetchApi<{ data: WebsiteSection }>('/website-sections', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    addBuiltIn: (
      weddingId: string,
      data: { sectionType: string; title: string; content: Record<string, unknown> },
      token: string,
    ) =>
      fetchApi<{ data: WebsiteSection }>(`/website-sections/add-built-in?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/website-sections/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
  },
  websitePhotos: {
    list: (weddingId: string, token: string, sectionId?: string) => {
      const params = new URLSearchParams({ weddingId })
      if (sectionId) params.set('sectionId', sectionId)
      return fetchApi<{ data: WebsitePhoto[] }>(`/website-photos?${params}`, { token })
    },
    requestUpload: (data: RequestPhotoUploadInput, token: string) =>
      fetchApi<{ data: { uploadUrl: string; r2Key: string; url: string; photoId: string } }>(
        '/website-photos/upload-url',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        },
      ),
    register: (data: RegisterPhotoInput, token: string) =>
      fetchApi<{ data: WebsitePhoto }>('/website-photos', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/website-photos/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    reorder: (weddingId: string, data: ReorderPhotosInput, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/website-photos/reorder?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
  },
  websiteAnalytics: {
    getSummary: (weddingId: string, token: string) =>
      fetchApi<{ data: WebsiteAnalyticsSummary }>(`/website-analytics?weddingId=${weddingId}`, {
        token,
      }),
  },
  websitePublic: {
    getBySlug: (slug: string) =>
      fetchApi<{ data: WebsiteWithSections }>(`/website-public/${encodeURIComponent(slug)}`),
    verifyPassword: (subdomain: string, data: VerifyWebsitePasswordInput) =>
      fetchApi<{ data: { valid: boolean } }>('/website-config/verify-password', {
        method: 'POST',
        body: JSON.stringify({ subdomain, ...data }),
      }),
    trackView: (slug: string, data: TrackPageViewInput) =>
      fetchApi<{ data: { success: boolean } }>(
        `/website-public/${encodeURIComponent(slug)}/track`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
    getGuestbookEntries: (slug: string) =>
      fetchApi<{ data: GuestbookEntry[] }>(`/website-public/${encodeURIComponent(slug)}/guestbook`),
    submitGuestbookEntry: (data: CreateGuestbookEntryInput) =>
      fetchApi<{ data: GuestbookEntry }>('/guestbook', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  guestbook: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: GuestbookEntry[] }>(`/guestbook?weddingId=${weddingId}`, { token }),
    approve: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: GuestbookEntry }>(`/guestbook/${id}/approve?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify({ approved: true }),
        token,
      }),
    reject: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: GuestbookEntry }>(`/guestbook/${id}/approve?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify({ approved: false }),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/guestbook/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  prayers: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: Prayer[] }>(`/prayers?weddingId=${weddingId}`, { token }),
    approve: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: Prayer }>(`/prayers/${id}/approve?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify({ approved: true }),
        token,
      }),
    reject: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: Prayer }>(`/prayers/${id}/approve?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify({ approved: false }),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/prayers/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  playlists: {
    list: (weddingId: string, token: string) =>
      fetchApi<{
        data: Array<{
          id: string
          weddingId: string
          name: string
          description: string | null
          spotifyUrl: string | null
          appleMusicUrl: string | null
          youtubeMusicUrl: string | null
          isAcceptedSongs: boolean
          createdAt: Date
        }>
      }>(`/playlists?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{
        data: {
          id: string
          name: string
          description: string | null
          spotifyUrl: string | null
          appleMusicUrl: string | null
          youtubeMusicUrl: string | null
          songs: Array<{
            id: string
            title: string
            artist: string
            album: string | null
            albumArt: string | null
            durationMs: number | null
            spotifyTrackId: string | null
            category: string | null
            sortOrder: number
          }>
        }
      }>(`/playlists/${id}?weddingId=${weddingId}`, { token }),
    create: (data: CreatePlaylistInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>('/playlists', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdatePlaylistInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(`/playlists/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/playlists/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    addSong: (data: CreatePlaylistSongInput, weddingId: string, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(
        `/playlists/${data.playlistId}/songs?weddingId=${weddingId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        },
      ),
    deleteSong: (songId: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(
        `/playlists/songs/${songId}?weddingId=${weddingId}`,
        {
          method: 'DELETE',
          token,
        },
      ),
    importSpotify: (playlistId: string, weddingId: string, spotifyUrl: string, token: string) =>
      fetchApi<{ data: { imported: number; songs: Array<Record<string, unknown>> } }>(
        `/playlists/${playlistId}/import-spotify?weddingId=${weddingId}`,
        {
          method: 'POST',
          body: JSON.stringify({ spotifyUrl }),
          token,
        },
      ),
    addSpotifyTrack: (playlistId: string, weddingId: string, spotifyUrl: string, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(
        `/playlists/${playlistId}/add-spotify-track?weddingId=${weddingId}`,
        {
          method: 'POST',
          body: JSON.stringify({ spotifyUrl }),
          token,
        },
      ),
    refreshSpotify: (playlistId: string, weddingId: string, token: string) =>
      fetchApi<{ data: { imported: number; songs: Array<Record<string, unknown>> } }>(
        `/playlists/${playlistId}/refresh-spotify?weddingId=${weddingId}`,
        {
          method: 'POST',
          token,
        },
      ),
    listRequests: (weddingId: string, token: string) =>
      fetchApi<{
        data: Array<{
          id: string
          guestName: string
          title: string
          artist: string
          notes: string | null
          isApproved: boolean
          status: string
          createdAt: Date
        }>
      }>(`/playlists/requests/all?weddingId=${weddingId}`, { token }),
    approveRequest: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(
        `/playlists/requests/${id}/approve?weddingId=${weddingId}`,
        {
          method: 'PUT',
          token,
        },
      ),
    deleteRequest: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/playlists/requests/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
  },
  honeymoon: {
    list: (weddingId: string, token: string) =>
      fetchApi<{
        data: Array<{
          id: string
          weddingId: string
          destination: string
          startDate: string | null
          endDate: string | null
          budget: number | null
          notes: string | null
          packingList: string[] | null
          createdAt: Date
        }>
      }>(`/honeymoon?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{
        data: {
          id: string
          destination: string
          startDate: string | null
          endDate: string | null
          budget: number | null
          notes: string | null
          packingList: string[] | null
          activities: Array<{
            id: string
            dayNumber: number
            title: string
            description: string | null
            location: string | null
            startTime: string | null
            endTime: string | null
            cost: number | null
            sortOrder: number
          }>
        }
      }>(`/honeymoon/${id}?weddingId=${weddingId}`, { token }),
    create: (data: CreateHoneymoonPlanInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>('/honeymoon', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdateHoneymoonPlanInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(`/honeymoon/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/honeymoon/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    addActivity: (planId: string, data: CreateHoneymoonActivityInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(`/honeymoon/${planId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updateActivity: (activityId: string, data: UpdateHoneymoonActivityInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(`/honeymoon/activities/${activityId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    deleteActivity: (activityId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/honeymoon/activities/${activityId}`, {
        method: 'DELETE',
        token,
      }),
  },
  emailCampaigns: {
    list: (weddingId: string, token: string) =>
      fetchApi<{
        data: Array<{
          id: string
          weddingId: string
          subject: string
          body: string
          templateType: string | null
          status: string
          scheduledAt: string | null
          sentAt: string | null
          createdAt: Date
        }>
      }>(`/email-campaigns?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{
        data: {
          id: string
          subject: string
          body: string
          templateType: string | null
          status: string
          scheduledAt: string | null
          recipientFilter: Record<string, unknown> | null
        }
      }>(`/email-campaigns/${id}?weddingId=${weddingId}`, { token }),
    create: (data: CreateEmailCampaignInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>('/email-campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: UpdateEmailCampaignInput, token: string) =>
      fetchApi<{ data: Record<string, unknown> }>(`/email-campaigns/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/email-campaigns/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    getRecipients: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: Array<{ id: string; email: string; name: string }> }>(
        `/email-campaigns/${id}/recipients?weddingId=${weddingId}`,
        { token },
      ),
  },
  seatingCharts: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: SeatingChart[] }>(`/seating-charts?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: SeatingChartWithTables }>(`/seating-charts/${id}?weddingId=${weddingId}`, {
        token,
      }),
    create: (data: { weddingId: string; name: string }, token: string) =>
      fetchApi<{ data: SeatingChart }>(`/seating-charts?weddingId=${data.weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (
      id: string,
      weddingId: string,
      data: { name?: string; status?: string },
      token: string,
    ) =>
      fetchApi<{ data: SeatingChart }>(`/seating-charts/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/seating-charts/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    addTable: (
      chartId: string,
      weddingId: string,
      data: {
        chartId: string
        label: string
        tableType?: string
        capacity?: number
        posX?: number
        posY?: number
      },
      token: string,
    ) =>
      fetchApi<{ data: SeatingTable }>(`/seating-charts/${chartId}/tables?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updateTable: (
      tableId: string,
      weddingId: string,
      data: {
        label?: string
        capacity?: number
        posX?: number
        posY?: number
        width?: number
        height?: number
      },
      token: string,
    ) =>
      fetchApi<{ data: SeatingTable }>(`/seating-charts/tables/${tableId}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    deleteTable: (tableId: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(
        `/seating-charts/tables/${tableId}?weddingId=${weddingId}`,
        {
          method: 'DELETE',
          token,
        },
      ),
    assignGuest: (
      data: {
        tableId: string
        guestId?: string | null
        guestName?: string | null
        seatNumber?: number
      },
      weddingId: string,
      token: string,
    ) =>
      fetchApi<{ data: SeatingAssignment }>(`/seating-charts/assignments?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    unassignSeat: (assignmentId: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(
        `/seating-charts/assignments/${assignmentId}?weddingId=${weddingId}`,
        {
          method: 'DELETE',
          token,
        },
      ),
  },
  vendors: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: Vendor[] }>(`/vendors?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: Vendor }>(`/vendors/${id}?weddingId=${weddingId}`, { token }),
    create: (
      data: {
        weddingId: string
        name: string
        category: string
        status?: string
        contactName?: string
        email?: string
        phone?: string
        website?: string
        cost?: number
        notes?: string
      },
      token: string,
    ) =>
      fetchApi<{ data: Vendor }>('/vendors', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, weddingId: string, data: Record<string, unknown>, token: string) =>
      fetchApi<{ data: Vendor }>(`/vendors/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/vendors/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    listCommunications: (vendorId: string, weddingId: string, token: string) =>
      fetchApi<{ data: VendorCommunication[] }>(
        `/vendors/${vendorId}/communications?weddingId=${weddingId}`,
        { token },
      ),
    addCommunication: (
      vendorId: string,
      weddingId: string,
      data: { vendorId: string; type: string; subject?: string; body?: string; date: string },
      token: string,
    ) =>
      fetchApi<{ data: VendorCommunication }>(
        `/vendors/${vendorId}/communications?weddingId=${weddingId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        },
      ),
  },
  events: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: WeddingEvent[] }>(`/events?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: WeddingEvent }>(`/events/${id}?weddingId=${weddingId}`, { token }),
    create: (
      data: {
        weddingId: string
        name: string
        type: string
        date?: string
        startTime?: string
        endTime?: string
        venue?: string
        address?: string
        description?: string
        dressCode?: string
      },
      token: string,
    ) =>
      fetchApi<{ data: WeddingEvent }>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, weddingId: string, data: Record<string, unknown>, token: string) =>
      fetchApi<{ data: WeddingEvent }>(`/events/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/events/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    listTimeline: (eventId: string, weddingId: string, token: string) =>
      fetchApi<{ data: TimelineEntry[] }>(`/events/${eventId}/timeline?weddingId=${weddingId}`, {
        token,
      }),
    createTimelineEntry: (
      eventId: string,
      data: {
        eventId: string
        time: string
        title: string
        description?: string
        duration?: number
      },
      token: string,
    ) =>
      fetchApi<{ data: TimelineEntry }>(`/events/${eventId}/timeline`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updateTimelineEntry: (
      entryId: string,
      weddingId: string,
      data: { time?: string; title?: string; description?: string; duration?: number },
      token: string,
    ) =>
      fetchApi<{ data: TimelineEntry }>(`/events/timeline/${entryId}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    deleteTimelineEntry: (entryId: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(
        `/events/timeline/${entryId}?weddingId=${weddingId}`,
        {
          method: 'DELETE',
          token,
        },
      ),
  },
  photoGallery: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: GalleryPhoto[] }>(`/photos?weddingId=${weddingId}`, { token }),
    get: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: GalleryPhoto }>(`/photos/${id}?weddingId=${weddingId}`, { token }),
    getUploadUrl: (
      data: { weddingId: string; fileName: string; mimeType: string; fileSize: number },
      token: string,
    ) =>
      fetchApi<{ data: { uploadUrl: string; r2Key: string; url: string; photoId: string } }>(
        '/photos/upload-url',
        { method: 'POST', body: JSON.stringify(data), token },
      ),
    create: (
      data: {
        weddingId: string
        r2Key: string
        url: string
        fileName: string
        mimeType: string
        fileSize: number
        caption?: string
        source?: 'guest' | 'professional' | 'couple'
      },
      token: string,
    ) =>
      fetchApi<{ data: GalleryPhoto }>('/photos', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (
      id: string,
      weddingId: string,
      data: { caption?: string; isFavorite?: boolean },
      token: string,
    ) =>
      fetchApi<{ data: GalleryPhoto }>(`/photos/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/photos/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    moderate: (id: string, weddingId: string, status: 'approved' | 'rejected', token: string) =>
      fetchApi<{ data: GalleryPhoto }>(`/photos/${id}/moderate?weddingId=${weddingId}`, {
        method: 'POST',
        body: JSON.stringify({ status }),
        token,
      }),
  },
  registry: {
    listLinks: (weddingId: string, token: string) =>
      fetchApi<{ data: RegistryLink[] }>(`/registry/links?weddingId=${weddingId}`, { token }),
    createLink: (
      data: { weddingId: string; storeName: string; url: string; logoUrl?: string },
      token: string,
    ) =>
      fetchApi<{ data: RegistryLink }>('/registry/links', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    deleteLink: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/registry/links/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    listFunds: (weddingId: string, token: string) =>
      fetchApi<{ data: CashFund[] }>(`/registry/funds?weddingId=${weddingId}`, { token }),
    createFund: (
      data: { weddingId: string; name: string; description?: string; goalAmount: number },
      token: string,
    ) =>
      fetchApi<{ data: CashFund }>('/registry/funds', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updateFund: (
      id: string,
      weddingId: string,
      data: { name?: string; description?: string; goalAmount?: number; isActive?: boolean },
      token: string,
    ) =>
      fetchApi<{ data: CashFund }>(`/registry/funds/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    deleteFund: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/registry/funds/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
    contribute: (
      fundId: string,
      weddingId: string,
      data: { fundId: string; guestName: string; amount: number; message?: string },
      token: string,
    ) =>
      fetchApi<{ data: CashFundContribution }>(
        `/registry/funds/${fundId}/contribute?weddingId=${weddingId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        },
      ),
    listGifts: (weddingId: string, token: string) =>
      fetchApi<{ data: Gift[] }>(`/registry/gifts?weddingId=${weddingId}`, { token }),
    createGift: (
      data: { weddingId: string; guestName?: string; description: string; estimatedValue?: number },
      token: string,
    ) =>
      fetchApi<{ data: Gift }>('/registry/gifts', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    updateGift: (
      id: string,
      weddingId: string,
      data: { description?: string; thankYouStatus?: string; notes?: string },
      token: string,
    ) =>
      fetchApi<{ data: Gift }>(`/registry/gifts/${id}?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
    deleteGift: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/registry/gifts/${id}?weddingId=${weddingId}`, {
        method: 'DELETE',
        token,
      }),
  },
  notificationPrefs: {
    get: (weddingId: string, token: string) =>
      fetchApi<{ data: NotificationPreference | null }>(
        `/notification-prefs?weddingId=${weddingId}`,
        { token },
      ),
    update: (weddingId: string, data: UpdateNotificationPreferencesInput, token: string) =>
      fetchApi<{ data: NotificationPreference }>(`/notification-prefs?weddingId=${weddingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
      }),
  },
  progress: {
    get: (weddingId: string, token: string) =>
      fetchApi<{ data: PlanningProgress }>(`/progress?weddingId=${weddingId}`, { token }),
    updatePreferences: (
      data: { weddingId: string; overrides?: Record<string, number>; hidden?: string[] },
      token: string,
    ) =>
      fetchApi<{ data: { overrides: Record<string, number>; hidden: string[] } }>(
        '/progress/preferences',
        { method: 'PUT', body: JSON.stringify(data), token },
      ),
  },
  inbox: {
    list: (token: string, filters?: Partial<InboxFiltersInput>) => {
      const params = new URLSearchParams()
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
        }
      }
      return fetchApi<PaginatedResponse<Email>>(`/inbox?${params}`, { token })
    },
    get: (id: string, token: string) => fetchApi<{ data: Email }>(`/inbox/${id}`, { token }),
    send: (data: ComposeEmailInput, token: string) =>
      fetchApi<{ data: Email }>('/inbox/send', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      }),
    update: (id: string, data: UpdateEmailInput, token: string) =>
      fetchApi<{ data: Email }>(`/inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        token,
      }),
    delete: (id: string, token: string) =>
      fetchApi<{ data: { success: boolean } }>(`/inbox/${id}`, { method: 'DELETE', token }),
    unreadCount: (token: string) =>
      fetchApi<{ data: { count: number } }>('/inbox/unread-count', { token }),
    addresses: {
      list: (token: string) => fetchApi<{ data: EmailAddress[] }>('/inbox/addresses', { token }),
      claim: (data: ClaimAddressInput, token: string) =>
        fetchApi<{ data: EmailAddress }>('/inbox/addresses', {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        }),
      checkAvailability: (address: string, token: string) =>
        fetchApi<{ data: { available: boolean; reason?: string } }>(
          `/inbox/addresses/check?address=${encodeURIComponent(address)}`,
          { token },
        ),
    },
  },
  notifications: {
    badges: (weddingId: string, token: string) =>
      fetchApi<{
        data: { inbox: number; music: number; photos: number; messages: number; prayers: number }
      }>(`/notifications/badges?weddingId=${weddingId}`, { token }),
  },
}
