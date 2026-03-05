'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'

interface AcceptInviteClientProps {
  token: string
}

export function AcceptInviteClient({ token }: AcceptInviteClientProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setStatus('accepting')
    setError(null)

    try {
      const authToken = await getToken()
      if (!authToken) throw new Error('Not authenticated')

      await api.weddings.acceptInvite(token, authToken)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={status === 'accepting'}
        className="bg-wedding-600 hover:bg-wedding-700 focus-visible:outline-wedding-600 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'accepting' ? 'Joining...' : 'Accept & Join'}
      </button>
    </div>
  )
}
