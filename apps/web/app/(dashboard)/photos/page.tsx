'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, staggerGrid, fadeInUp } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { GalleryPhoto } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function PhotosPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [captionInput, setCaptionInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'favorites'>(
    'all',
  )

  const loadPhotos = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.photoGallery.list(weddingId, token)
      setPhotos(data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  const handleAddPhoto = async () => {
    if (!weddingId || !urlInput.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.create(
        { weddingId, url: urlInput.trim(), caption: captionInput || undefined },
        token,
      )
      setUrlInput('')
      setCaptionInput('')
      setShowUpload(false)
      void loadPhotos()
    } catch {
      /* silent */
    }
  }

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.moderate(id, weddingId, status, token)
      void loadPhotos()
    } catch {
      /* silent */
    }
  }

  const handleToggleFavorite = async (photo: GalleryPhoto) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.update(photo.id, weddingId, { isFavorite: !photo.isFavorite }, token)
      void loadPhotos()
    } catch {
      /* silent */
    }
  }

  const handleDelete = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.delete(id, weddingId, token)
      void loadPhotos()
    } catch {
      /* silent */
    }
  }

  const filteredPhotos = photos.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'favorites') return p.isFavorite
    return p.moderationStatus === filter
  })

  const pendingCount = photos.filter((p) => p.moderationStatus === 'pending').length

  const isLoading = weddingLoading || loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Photos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your wedding photo gallery.
            {pendingCount > 0 && (
              <span className="ml-2 font-medium text-amber-600">{pendingCount} pending review</span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>Add Photo</Button>
      </div>

      {photos.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'pending', 'approved', 'rejected', 'favorites'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-wedding-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f} {f === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
            </button>
          ))}
        </div>
      )}

      {filteredPhotos.length === 0 && photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                className="text-wedding-600 h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Photos Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Add photos to build your wedding gallery.
            </p>
            <Button className="mt-6" onClick={() => setShowUpload(true)}>
              Add Your First Photo
            </Button>
          </CardContent>
        </Card>
      ) : filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-gray-500">No photos match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
        >
          {filteredPhotos.map((photo) => (
            <motion.div key={photo.id} variants={fadeInUp}>
              <Card className="group overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? 'Wedding photo'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleToggleFavorite(photo)}
                      className={`rounded-full p-1.5 text-xs ${photo.isFavorite ? 'bg-yellow-400 text-white' : 'bg-white/90 text-gray-700'}`}
                      title={photo.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      &#9733;
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="rounded-full bg-white/90 p-1.5 text-xs text-red-600"
                      title="Delete"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge
                      variant={
                        photo.moderationStatus === 'approved'
                          ? 'default'
                          : photo.moderationStatus === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {photo.moderationStatus}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  {photo.caption && (
                    <p className="truncate text-sm text-gray-700">{photo.caption}</p>
                  )}
                  {photo.moderationStatus === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleModerate(photo.id, 'approved')}
                        className="flex-1 rounded-lg bg-green-50 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerate(photo.id, 'rejected')}
                        className="flex-1 rounded-lg bg-red-50 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo-url">Photo URL</Label>
              <Input
                id="photo-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="photo-caption">Caption (optional)</Label>
              <Input
                id="photo-caption"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Describe this photo"
              />
            </div>
            <Button onClick={handleAddPhoto} className="w-full">
              Add Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
