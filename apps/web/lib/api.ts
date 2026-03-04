import type {
  User,
  Wedding,
  DashboardData,
  PartnerInvitation,
  OnboardingData,
} from '@planfortwo/types'

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
}
