'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function SpotifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1DB954]" />
        </div>
      }
    >
      <SpotifyCallbackInner />
    </Suspense>
  )
}

function SpotifyCallbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { getToken } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Connecting your Spotify account...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(
        error === 'access_denied' ? 'Spotify access was denied.' : `Spotify error: ${error}`,
      )
      setTimeout(() => router.push('/music'), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorization code received.')
      setTimeout(() => router.push('/music'), 3000)
      return
    }

    const exchange = async () => {
      try {
        const token = await getToken()
        if (!token) throw new Error('Not authenticated')

        const res = await api.spotify.exchange(code, token)
        if (res.data.connected) {
          setStatus('success')
          setMessage(
            res.data.spotifyDisplayName
              ? `Connected as ${res.data.spotifyDisplayName}!`
              : 'Spotify connected successfully!',
          )
        } else {
          throw new Error('Connection failed')
        }
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Failed to connect Spotify')
      }

      // Redirect back to music page after a brief delay
      setTimeout(() => router.push('/music'), 2000)
    }

    void exchange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1DB954]" />
            <p className="mt-4 text-gray-600">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#1DB954]" />
            <p className="mt-4 font-medium text-gray-900">{message}</p>
            <p className="mt-1 text-sm text-gray-500">Redirecting to Music...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <p className="mt-4 font-medium text-gray-900">{message}</p>
            <p className="mt-1 text-sm text-gray-500">Redirecting to Music...</p>
          </>
        )}
      </div>
    </div>
  )
}
