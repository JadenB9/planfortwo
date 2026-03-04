'use client'

import { useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CsvImportResult } from '@planfortwo/types'
import { api } from '@/lib/api'
import { useWedding } from '@/hooks/use-wedding'
import { useFeatures } from '@/hooks/use-features'
import { ImportWizard } from '@/components/guests/import-wizard'

export default function GuestImportPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const { features, loading: featuresLoading } = useFeatures(weddingId)

  const handleImport = useCallback(async (file: File): Promise<CsvImportResult> => {
    if (!weddingId) throw new Error('No wedding found')
    const token = await getToken()
    if (!token) throw new Error('Not authenticated')
    const { data } = await api.guests.bulkImport(weddingId, file, token)
    return data
  }, [weddingId, getToken])

  if (weddingLoading || featuresLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
      </div>
    )
  }

  if (!features?.canBulkImport) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-gray-900">Bulk Import</h2>
        <p className="mt-2 text-sm text-gray-600">
          CSV import is available on the full plan. Upgrade to import your guest list in bulk.
        </p>
        <Link
          href="/guests"
          className="mt-4 inline-block rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Guest List
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-6">
        <Link
          href="/guests"
          className="text-sm text-wedding-600 hover:text-wedding-700"
        >
          &larr; Back to Guest List
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-bold text-gray-900">Import Guests</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload a CSV file to bulk import your guest list.
        </p>
      </div>

      <ImportWizard
        onImport={handleImport}
        onClose={() => router.push('/guests')}
      />
    </div>
  )
}
