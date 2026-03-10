'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RegistryViewerProps {
  url: string
  storeName: string
  open: boolean
  onClose: () => void
  /** Optional accent color for the header bar */
  accentColor?: string
}

export function RegistryViewer({
  url,
  storeName,
  open,
  onClose,
  accentColor,
}: RegistryViewerProps) {
  const [loading, setLoading] = useState(true)

  // Reset loading state when URL or open state changes
  useEffect(() => {
    if (open) {
      setLoading(true)
    }
  }, [open, url])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handleLoad = useCallback(() => {
    setLoading(false)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header bar */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ backgroundColor: accentColor ? `${accentColor}08` : '#fafafa' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            <X className="mr-1 h-4 w-4" />
            Close
          </Button>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-gray-900">{storeName}</p>
            <p className="max-w-xs truncate text-xs text-gray-500 lg:max-w-lg">{url}</p>
          </div>
          <p className="truncate text-sm font-semibold text-gray-900 sm:hidden">{storeName}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open in New Tab</span>
            <span className="sm:hidden">New Tab</span>
          </Button>
        </a>
      </div>

      {/* Hint banner — shows after loading, since some sites block iframes */}
      {!loading && (
        <div className="flex shrink-0 items-center justify-center gap-2 border-b bg-blue-50 px-4 py-1.5 text-xs text-blue-700">
          <Info className="h-3 w-3 shrink-0" />
          <span>
            If this page appears blank, the site may not support inline viewing.{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Open in a new tab instead
            </a>
          </span>
        </div>
      )}

      {/* Iframe content area */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading {storeName}...</p>
          </div>
        )}

        <iframe
          src={url}
          title={storeName}
          className="h-full w-full border-0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation"
          onLoad={handleLoad}
        />
      </div>
    </div>
  )
}
