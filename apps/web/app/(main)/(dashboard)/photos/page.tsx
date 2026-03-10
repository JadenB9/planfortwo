'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { springSmooth, staggerGrid, fadeInUp, scaleIn } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { refreshBadges } from '@/hooks/use-notification-badges'
import { api } from '@/lib/api'
import type { GalleryPhoto } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Camera,
  Upload,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Loader2,
  ImagePlus,
} from 'lucide-react'

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'favorites'

interface UploadingFile {
  id: string
  file: File
  previewUrl: string
  status: 'uploading' | 'done' | 'failed'
  progress: number
}

export default function PhotosPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const loadPhotos = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.photoGallery.list(weddingId, token)
      setPhotos(data)
    } catch {
      toast.error('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadPhotos()
  }, [loadPhotos])

  // --- Upload logic ---

  const uploadSingleFile = async (uploadFile: UploadingFile) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) throw new Error('No token')

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 20 } : f,
        ),
      )

      const { data: uploadData } = await api.photoGallery.getUploadUrl(
        {
          weddingId,
          fileName: uploadFile.file.name,
          mimeType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
        },
        token,
      )

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 50 } : f)),
      )

      const r2Response = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: uploadFile.file,
        headers: { 'Content-Type': uploadFile.file.type },
      })
      if (!r2Response.ok) {
        throw new Error(`Upload to storage failed (${r2Response.status})`)
      }

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 80 } : f)),
      )

      await api.photoGallery.create(
        {
          weddingId,
          r2Key: uploadData.r2Key,
          url: uploadData.url,
          fileName: uploadFile.file.name,
          mimeType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
          source: 'couple',
        },
        token,
      )

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'done' as const, progress: 100 } : f,
        ),
      )
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'Failed to upload photo'
      toast.error(message)
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'failed' as const } : f)),
      )
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      toast.error('Please select image files')
      return
    }

    const newUploads: UploadingFile[] = imageFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading' as const,
      progress: 0,
    }))

    setUploadingFiles((prev) => [...prev, ...newUploads])

    await Promise.allSettled(newUploads.map((uf) => uploadSingleFile(uf)))
    void loadPhotos()

    setTimeout(() => {
      setUploadingFiles((prev) => {
        prev.filter((f) => f.status === 'done').forEach((f) => URL.revokeObjectURL(f.previewUrl))
        return prev.filter((f) => f.status !== 'done')
      })
    }, 2000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  // --- Drag & drop ---

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files)
    }
  }

  // --- Photo actions ---

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.moderate(id, weddingId, status, token)
      toast.success(`Photo ${status}`)
      refreshBadges()
      void loadPhotos()
    } catch {
      toast.error('Failed to moderate photo')
    }
  }

  const handleToggleFavorite = async (photo: GalleryPhoto) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.update(photo.id, weddingId, { isFavorite: !photo.isFavorite }, token)
      toast.success(photo.isFavorite ? 'Removed from favorites' : 'Added to favorites')
      void loadPhotos()
    } catch {
      toast.error('Failed to update photo')
    }
  }

  const handleDelete = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.delete(id, weddingId, token)
      toast.success('Photo deleted')
      refreshBadges()
      setDeletingPhotoId(null)
      if (lightboxIndex !== null) {
        setLightboxIndex(null)
      }
      void loadPhotos()
    } catch {
      toast.error('Failed to delete photo')
    }
  }

  const handleSaveCaption = async () => {
    if (lightboxIndex === null || !weddingId) return
    const photo = filteredPhotos[lightboxIndex]
    if (!photo) return
    try {
      const token = await getToken()
      if (!token) return
      await api.photoGallery.update(
        photo.id,
        weddingId,
        { caption: captionDraft || undefined },
        token,
      )
      toast.success('Caption saved')
      setEditingCaption(false)
      void loadPhotos()
    } catch {
      toast.error('Failed to save caption')
    }
  }

  // --- Filtering ---

  const filteredPhotos = photos.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'favorites') return p.isFavorite
    return p.moderationStatus === filter
  })

  const pendingCount = photos.filter((p) => p.moderationStatus === 'pending').length
  const approvedCount = photos.filter((p) => p.moderationStatus === 'approved').length
  const rejectedCount = photos.filter((p) => p.moderationStatus === 'rejected').length
  const favoritesCount = photos.filter((p) => p.isFavorite).length

  const filterCounts: Record<FilterType, number> = {
    all: photos.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    favorites: favoritesCount,
  }

  // --- Lightbox navigation ---

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setEditingCaption(false)
    setCaptionDraft(filteredPhotos[index]?.caption ?? '')
  }

  const lightboxPrev = useCallback(() => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return
    const newIndex = (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length
    setLightboxIndex(newIndex)
    setEditingCaption(false)
    setCaptionDraft(filteredPhotos[newIndex]?.caption ?? '')
  }, [lightboxIndex, filteredPhotos])

  const lightboxNext = useCallback(() => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return
    const newIndex = (lightboxIndex + 1) % filteredPhotos.length
    setLightboxIndex(newIndex)
    setEditingCaption(false)
    setCaptionDraft(filteredPhotos[newIndex]?.caption ?? '')
  }, [lightboxIndex, filteredPhotos])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, lightboxPrev, lightboxNext])

  const isLoading = weddingLoading || loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const lightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
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
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Drop zone */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-wedding-50 border-wedding-400 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-16 py-12"
            >
              <ImagePlus className="text-wedding-600 h-12 w-12" />
              <p className="text-wedding-700 text-lg font-semibold">Drop photos to upload</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload previews */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {uploadingFiles.map((uf) => (
                <motion.div
                  key={uf.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uf.previewUrl}
                    alt="Upload preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    {uf.status === 'uploading' && (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    )}
                    {uf.status === 'done' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500"
                      >
                        <Check className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                    {uf.status === 'failed' && (
                      <span className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white">
                        Failed
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  {uf.status === 'uploading' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <motion.div
                        className="bg-wedding-400 h-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${uf.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter pills */}
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
              {f} ({filterCounts[f]})
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      {filteredPhotos.length === 0 && photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Camera className="text-wedding-600 h-8 w-8" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Photos Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Upload your first photos to build your wedding gallery.
            </p>
            <Button className="mt-6" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="mr-2 h-4 w-4" />
              Upload Your First Photos
            </Button>

            {/* Inline drop zone when empty */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-wedding-200 hover:border-wedding-400 hover:bg-wedding-50 mx-auto mt-6 flex max-w-sm cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">Drag photos here or click to browse</p>
              <p className="text-xs text-gray-400">Supports JPG, PNG, WebP, and more</p>
            </div>
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
          className="columns-2 gap-4 sm:columns-3 lg:columns-4"
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
        >
          {/* Upload drop zone card in grid */}
          <motion.div variants={fadeInUp} className="mb-4 break-inside-avoid">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-wedding-200 hover:border-wedding-400 hover:bg-wedding-50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors"
            >
              <Upload className="text-wedding-400 h-8 w-8" />
              <p className="text-wedding-600 text-sm font-medium">Add Photos</p>
              <p className="text-xs text-gray-400">Drag or click</p>
            </div>
          </motion.div>

          {filteredPhotos.map((photo, index) => (
            <motion.div key={photo.id} variants={fadeInUp} className="mb-4 break-inside-avoid">
              <Card className="group cursor-pointer overflow-hidden">
                <div className="relative bg-gray-100" onClick={() => openLightbox(index)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? 'Wedding photo'}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />

                  {/* Caption overlay on hover */}
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="truncate text-sm text-white">{photo.caption}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleToggleFavorite(photo)
                      }}
                      className={`rounded-full p-1.5 transition-colors ${
                        photo.isFavorite
                          ? 'bg-yellow-400 text-white'
                          : 'bg-white/90 text-gray-700 hover:bg-yellow-100'
                      }`}
                      title={photo.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star className={`h-3.5 w-3.5 ${photo.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingPhotoId(photo.id)
                      }}
                      className="rounded-full bg-white/90 p-1.5 text-red-600 transition-colors hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Moderation badge */}
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

                {/* Moderate buttons for pending */}
                {photo.moderationStatus === 'pending' && (
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(photo.id, 'approved')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleModerate(photo.id, 'rejected')}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && lightboxIndex !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous */}
            {filteredPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  lightboxPrev()
                }}
                className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next */}
            {filteredPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  lightboxNext()
                }}
                className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxPhoto.id}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2, ...springSmooth }}
              className="flex max-h-[85vh] max-w-[90vw] flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption ?? 'Wedding photo'}
                className="max-h-[70vh] max-w-full rounded-lg object-contain"
              />

              {/* Bottom bar */}
              <div className="mt-4 flex w-full max-w-lg flex-col items-center gap-3">
                {/* Caption */}
                {editingCaption ? (
                  <div className="flex w-full gap-2">
                    <input
                      type="text"
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      placeholder="Add a caption..."
                      className="flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveCaption()
                        if (e.key === 'Escape') setEditingCaption(false)
                      }}
                    />
                    <Button size="sm" variant="secondary" onClick={() => void handleSaveCaption()}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                      onClick={() => setEditingCaption(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCaptionDraft(lightboxPhoto.caption ?? '')
                      setEditingCaption(true)
                    }}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {lightboxPhoto.caption || 'Click to add caption...'}
                  </button>
                )}

                {/* Action row */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void handleToggleFavorite(lightboxPhoto)}
                    className={`rounded-full p-2 transition-colors ${
                      lightboxPhoto.isFavorite
                        ? 'bg-yellow-400 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title={lightboxPhoto.isFavorite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star className={`h-5 w-5 ${lightboxPhoto.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {lightboxPhoto.moderationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => void handleModerate(lightboxPhoto.id, 'approved')}
                        className="rounded-full bg-green-600/80 p-2 text-white transition-colors hover:bg-green-600"
                        title="Approve"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => void handleModerate(lightboxPhoto.id, 'rejected')}
                        className="rounded-full bg-red-600/80 p-2 text-white transition-colors hover:bg-red-600"
                        title="Reject"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  <Badge
                    variant={
                      lightboxPhoto.moderationStatus === 'approved'
                        ? 'default'
                        : lightboxPhoto.moderationStatus === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {lightboxPhoto.moderationStatus}
                  </Badge>

                  <button
                    onClick={() => setDeletingPhotoId(lightboxPhoto.id)}
                    className="rounded-full bg-white/10 p-2 text-red-400 transition-colors hover:bg-red-600/30"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>

                  {/* Counter */}
                  <span className="ml-2 text-xs text-white/50">
                    {lightboxIndex + 1} / {filteredPhotos.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deletingPhotoId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingPhotoId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this photo? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPhotoId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingPhotoId) void handleDelete(deletingPhotoId)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
