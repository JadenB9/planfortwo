'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/lib/api'

interface ReceiptUploadProps {
  budgetItemId: string
  weddingId: string
  currentReceiptUrl?: string | null
  onUploaded: () => void
}

export function ReceiptUpload({
  budgetItemId,
  weddingId,
  currentReceiptUrl,
  onUploaded,
}: ReceiptUploadProps) {
  const { getToken } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File must be under 10MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      // Get presigned upload URL
      const { data: urls } = await api.budgetItems.getUploadUrl(
        budgetItemId,
        weddingId,
        file.name,
        file.type,
        token,
      )

      // Upload file directly to R2
      const uploadRes = await fetch(urls.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      // Update the budget item with the receipt URL
      await api.budgetItems.update(
        budgetItemId,
        weddingId,
        {
          receiptUrl: urls.receiptUrl,
          receiptFileName: file.name,
        },
        token,
      )

      onUploaded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium text-gray-700">Receipt</label>

      {currentReceiptUrl && (
        <a
          href={currentReceiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-wedding-600 hover:text-wedding-700 inline-flex items-center gap-1 text-xs"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          View current receipt
        </a>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="file:bg-wedding-50 file:text-wedding-700 hover:file:bg-wedding-100 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {uploading && (
          <div className="border-wedding-200 border-t-wedding-600 h-5 w-5 animate-spin rounded-full border-2" />
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
