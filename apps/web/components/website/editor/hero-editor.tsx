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
        <label htmlFor="hero-headline" className="text-sm font-medium text-foreground">
          Headline
        </label>
        <input
          id="hero-headline"
          type="text"
          value={content.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Sarah & James"
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="hero-subheadline" className="text-sm font-medium text-foreground">
          Subheadline
        </label>
        <input
          id="hero-subheadline"
          type="text"
          value={content.subheadline}
          onChange={(e) => update({ subheadline: e.target.value })}
          placeholder="We're getting married!"
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Background Image</label>

        {/* URL Input */}
        <div className="mt-1">
          <input
            id="hero-bg-image"
            type="text"
            value={content.backgroundImageUrl ?? ''}
            onChange={(e) => update({ backgroundImageUrl: e.target.value || null })}
            placeholder="https://example.com/photo.jpg"
            className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a URL above, or select from your uploaded photos below.
          </p>
        </div>

        {/* Photo Picker from Gallery */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Your Photos</span>
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
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Loading photos...</span>
            </div>
          ) : galleryPhotos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted p-6 text-center">
              <p className="text-xs text-muted-foreground">
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
                        : 'border-transparent hover:border-border'
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
          className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hero-show-date" className="text-sm font-medium text-foreground">
          Show wedding date
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="hero-show-countdown"
          type="checkbox"
          checked={content.showCountdown}
          onChange={(e) => update({ showCountdown: e.target.checked })}
          className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hero-show-countdown" className="text-sm font-medium text-foreground">
          Show countdown timer
        </label>
      </div>
    </div>
  )
}
