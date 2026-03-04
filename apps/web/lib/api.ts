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
    me: (token: string) =>
      fetchApi<{ data: User }>('/users/me', { token }),
  },
  weddings: {
    mine: (token: string) =>
      fetchApi<{ data: DashboardData }>('/weddings/mine', { token }),
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
  },
  tasks: {
    list: (
      weddingId: string,
      token: string,
      params?: { categoryId?: string; priority?: string; status?: string; assignedToUserId?: string; sortBy?: string },
    ) => {
      const searchParams = new URLSearchParams({ weddingId })
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) searchParams.set(k, v)
        })
      }
      return fetchApi<{ data: ChecklistTask[] }>(`/tasks?${searchParams}`, { token })
    },
    get: (id: string, token: string) =>
      fetchApi<{ data: TaskWithDetails }>(`/tasks/${id}`, { token }),
    create: (data: CreateTaskInput, token: string) =>
      fetchApi<{ data: ChecklistTask }>('/tasks', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: UpdateTaskInput, token: string) =>
      fetchApi<{ data: ChecklistTask }>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    toggleComplete: (id: string, weddingId: string, token: string) =>
      fetchApi<{ data: ChecklistTask }>(`/tasks/${id}/complete?weddingId=${weddingId}`, { method: 'PATCH', token }),
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
      fetchApi<{ data: ChecklistCategory }>('/categories', { method: 'POST', body: JSON.stringify(data), token }),
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
      fetchApi<{ data: ActivityLogEntry[] }>(`/activity?weddingId=${weddingId}&limit=${limit}`, { token }),
  },
  features: {
    get: (weddingId: string, token: string) =>
      fetchApi<{ data: FeatureGates }>(`/features?weddingId=${weddingId}`, { token }),
  },
  guests: {
    list: (weddingId: string, token: string, filters?: object) => {
      const searchParams = new URLSearchParams({ weddingId })
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v !== undefined && v !== null && v !== '') searchParams.set(k, String(v))
        }
      }
      return fetchApi<{ data: GuestWithTags[] }>(`/guests?${searchParams}`, { token })
    },
    get: (id: string, token: string) =>
      fetchApi<{ data: GuestWithTags }>(`/guests/${id}`, { token }),
    create: (data: CreateGuestInput, token: string) =>
      fetchApi<{ data: Guest }>('/guests', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: UpdateGuestInput, weddingId: string, token: string) =>
      fetchApi<{ data: Guest }>(`/guests/${id}?weddingId=${weddingId}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/guests/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
    stats: (weddingId: string, token: string) =>
      fetchApi<{ data: GuestStats }>(`/guests/stats?weddingId=${weddingId}`, { token }),
    exportCsv: (weddingId: string, token: string) =>
      fetchApi<Blob>(`/guests/export?weddingId=${weddingId}`, { token }),
    bulkImport: async (weddingId: string, file: File, token: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('weddingId', weddingId)
      const res = await fetch(`${API_URL}/guests/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Import failed' }))
        throw new Error(error.error ?? 'Import failed')
      }
      return res.json() as Promise<{ data: CsvImportResult }>
    },
  },
  households: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: Household[] }>(`/households?weddingId=${weddingId}`, { token }),
    create: (data: CreateHouseholdInput, token: string) =>
      fetchApi<{ data: Household }>('/households', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: UpdateHouseholdInput, weddingId: string, token: string) =>
      fetchApi<{ data: Household }>(`/households/${id}?weddingId=${weddingId}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/households/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
  guestTags: {
    list: (weddingId: string, token: string) =>
      fetchApi<{ data: GuestTag[] }>(`/guest-tags?weddingId=${weddingId}`, { token }),
    create: (data: CreateGuestTagInput, token: string) =>
      fetchApi<{ data: GuestTag }>('/guest-tags', { method: 'POST', body: JSON.stringify(data), token }),
    delete: (id: string, weddingId: string, token: string) =>
      fetchApi<void>(`/guest-tags/${id}?weddingId=${weddingId}`, { method: 'DELETE', token }),
  },
}
