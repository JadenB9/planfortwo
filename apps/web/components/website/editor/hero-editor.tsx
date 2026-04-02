'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Loader2, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import type { HeroContent, GalleryPhoto } from '@planfortwo/types'

interface HeroEditorProps {
  content: HeroContent
  onChange: (content: HeroContent) => void
  getToken: () => Promise<string | null>
  weddingId: string
}

export function HeroEditor({ content, onChange, getToken, weddingId }: HeroEditorProps) {
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(true)

  const update = (fields: Partial<HeroContent>) => {
    onChange({ ...content, ...fields })
  }

  const fetchPhotos = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token || !weddingId) return
      const { data } = await api.photoGallery.list(weddingId, token)
      setGalleryPhotos(data ?? [])
    } catch {
      /* silent */
    } finally {
      setLoadingPhotos(false)
    }
  }, [getToken, weddingId])

  useEffect(() => {
    void fetchPhotos()
  }, [fetchPhotos])

  const isPhotoSelected = (url: string) => content.backgroundImageUrl === url

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="hero-headline" className="text-foreground text-sm font-medium">
          Headline
        </label>
        <input
          id="hero-headline"
          type="text"
          value={content.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Sarah & James"
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="hero-subheadline" className="text-foreground text-sm font-medium">
          Subheadline
        </label>
        <input
          id="hero-subheadline"
          type="text"
          value={content.subheadline}
          onChange={(e) => update({ subheadline: e.target.value })}
          placeholder="We're getting married!"
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-foreground text-sm font-medium">Background Image</label>

        {/* URL Input */}
        <div className="mt-1">
          <input
            id="hero-bg-image"
            type="text"
            value={content.backgroundImageUrl ?? ''}
            onChange={(e) => update({ backgroundImageUrl: e.target.value || null })}
            placeholder="https://example.com/photo.jpg"
            className="border-border block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Paste a URL above, or select from your uploaded photos below.
          </p>
        </div>

        {/* Photo Picker from Gallery */}
        <div className="border-border mt-3 border-t pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Your Photos</span>
            {content.backgroundImageUrl && (
              <button
                type="button"
                onClick={() => update({ backgroundImageUrl: null })}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Remove background
              </button>
            )}
          </div>

          {loadingPhotos ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              <span className="text-muted-foreground ml-2 text-xs">Loading photos...</span>
            </div>
          ) : galleryPhotos.length === 0 ? (
            <div className="border-border bg-muted flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
              <p className="text-muted-foreground text-xs">
                No photos uploaded yet.{' '}
                <a
                  href="/photos"
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                >
                  Upload photos <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {galleryPhotos.map((photo) => {
                const selected = isPhotoSelected(photo.url)
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      update({
                        backgroundImageUrl: selected ? null : photo.url,
                      })
                    }
                    className={`group relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                      selected
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'hover:border-border border-transparent'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumbnailUrl ?? photo.url}
                      alt={photo.caption ?? 'Gallery photo'}
                      className="h-full w-full object-cover"
                    />
                    {selected && (
                      <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="hero-show-date"
          type="checkbox"
          checked={content.showDate}
          onChange={(e) => update({ showDate: e.target.checked })}
          className="border-border h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hero-show-date" className="text-foreground text-sm font-medium">
          Show wedding date
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="hero-show-countdown"
          type="checkbox"
          checked={content.showCountdown}
          onChange={(e) => update({ showCountdown: e.target.checked })}
          className="border-border h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hero-show-countdown" className="text-foreground text-sm font-medium">
          Show countdown timer
        </label>
      </div>
    </div>
  )
}
