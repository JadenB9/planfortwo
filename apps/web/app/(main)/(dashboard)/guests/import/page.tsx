'use client'

import { useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CsvImportResult } from '@planfortwo/types'
import { api } from '@/lib/api'
import { useWedding } from '@/hooks/use-wedding'
import { ImportWizard } from '@/components/guests/import-wizard'

export default function GuestImportPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const { data: weddingData, features, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const handleImport = useCallback(
    async (file: File): Promise<CsvImportResult> => {
      if (!weddingId) throw new Error('No wedding found')
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      const { data } = await api.guests.bulkImport(weddingId, file, token)
      return data
    },
    [weddingId, getToken],
  )

  if (weddingLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  if (!features?.canBulkImport) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h2 className="text-foreground font-serif text-2xl font-bold">Bulk Import</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          CSV import is available on the full plan. Upgrade to import your guest list in bulk.
        </p>
        <Link
          href="/guests"
          className="border-border text-foreground hover:bg-muted mt-4 inline-block rounded-xl border px-4 py-2 text-sm font-medium"
        >
          Back to Guest List
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/guests" className="text-wedding-600 hover:text-wedding-700 text-sm">
          &larr; Back to Guest List
        </Link>
        <h1 className="text-foreground mt-2 font-serif text-3xl font-bold">Import Guests</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload a CSV file to bulk import your guest list.
        </p>
      </div>

      <ImportWizard onImport={handleImport} onClose={() => router.push('/guests')} />
    </div>
  )
}
