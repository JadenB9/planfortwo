'use client'

import { useState, useEffect, useCallback } from 'react'
import { Image, Check, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { GalleryContent, GalleryPhoto, WebsitePhoto } from '@planfortwo/types'

interface GalleryEditorProps {
  content: GalleryContent
  onChange: (content: GalleryContent) => void
  getToken: () => Promise<string | null>
  weddingId: string
  sectionId: string
}

export function GalleryEditor({
  content,
  onChange,
  getToken,
  weddingId,
  sectionId,
}: GalleryEditorProps) {
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([])
  const [websitePhotos, setWebsitePhotos] = useState<WebsitePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const fetchPhotos = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token || !weddingId) return

      const [galleryRes, websiteRes] = await Promise.all([
        api.photoGallery.list(weddingId, token),
        api.websitePhotos.list(weddingId, token, sectionId),
      ])

      setGalleryPhotos(galleryRes.data ?? [])
      setWebsitePhotos(websiteRes.data ?? [])
    } catch {
      toast.error('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [getToken, weddingId, sectionId])

  useEffect(() => {
    void fetchPhotos()
  }, [fetchPhotos])

  const getWebsitePhotoForGalleryPhoto = (galleryPhoto: GalleryPhoto): WebsitePhoto | undefined => {
    return websitePhotos.find((wp) => wp.url === galleryPhoto.url)
  }

  const handleTogglePhoto = async (photo: GalleryPhoto) => {
    if (togglingIds.has(photo.id)) return

    setTogglingIds((prev) => new Set(prev).add(photo.id))

    try {
      const token = await getToken()
      if (!token) return

      const existingWebsitePhoto = getWebsitePhotoForGalleryPhoto(photo)

      if (existingWebsitePhoto) {
        await api.websitePhotos.delete(existingWebsitePhoto.id, weddingId, token)
        setWebsitePhotos((prev) => prev.filter((wp) => wp.id !== existingWebsitePhoto.id))
      } else {
        const urlParts = new URL(photo.url)
        const r2Key = urlParts.pathname.slice(1)
        const fileName = r2Key.split('/').pop() ?? 'photo'

        const res = await api.websitePhotos.register(
          {
            weddingId,
            r2Key,
            url: photo.url,
            fileName,
            mimeType: 'image/jpeg',
            fileSize: 0,
            sectionId,
          },
          token,
        )
        setWebsitePhotos((prev) => [...prev, res.data])
      }
    } catch {
      toast.error('Failed to update photo selection')
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev)
        next.delete(photo.id)
        return next
      })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="gallery-layout" className="text-foreground text-sm font-medium">
          Layout
        </label>
        <select
          id="gallery-layout"
          value={content.layout}
          onChange={(e) =>
            onChange({
              ...content,
              layout: e.target.value as GalleryContent['layout'],
            })
          }
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="grid">Grid</option>
          <option value="masonry">Masonry</option>
          <option value="slideshow">Slideshow</option>
        </select>
      </div>

      {content.layout === 'grid' && (
        <div>
          <label htmlFor="gallery-columns" className="text-foreground text-sm font-medium">
            Columns
          </label>
          <input
            id="gallery-columns"
            type="number"
            min={2}
            max={6}
            value={content.columns}
            onChange={(e) => {
              const value = Math.min(6, Math.max(2, Number(e.target.value) || 2))
              onChange({ ...content, columns: value })
            }}
            className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-muted-foreground mt-1 text-xs">Between 2 and 6 columns.</p>
        </div>
      )}

      <div className="border-border border-t pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-foreground text-sm font-medium">Photos</h3>
          {websitePhotos.length > 0 && (
            <span className="text-muted-foreground text-xs">{websitePhotos.length} selected</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading photos...</span>
          </div>
        ) : galleryPhotos.length === 0 ? (
          <div className="border-border bg-muted flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <Image className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-foreground text-sm font-medium">No photos uploaded yet</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Upload photos in the{' '}
                <a
                  href="/photos"
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                >
                  Photos <ExternalLink className="h-3 w-3" />
                </a>{' '}
                section first, then select them here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {galleryPhotos.map((photo) => {
              const isSelected = !!getWebsitePhotoForGalleryPhoto(photo)
              const isToggling = togglingIds.has(photo.id)

              return (
                <button
                  key={photo.id}
                  type="button"
                  disabled={isToggling}
                  onClick={() => void handleTogglePhoto(photo)}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'hover:border-border border-transparent'
                  } ${isToggling ? 'opacity-60' : ''}`}
                >
                  <img
                    src={photo.thumbnailUrl ?? photo.url}
                    alt={photo.caption ?? 'Gallery photo'}
                    className="h-full w-full object-cover"
                  />

                  {isToggling && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}

                  {isSelected && !isToggling && (
                    <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-sm">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {!isSelected && !isToggling && (
                    <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/80 bg-black/20 opacity-0 shadow-sm transition-opacity group-hover:opacity-100" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
