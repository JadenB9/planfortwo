'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { GalleryContent, WebsitePhoto } from '@planfortwo/types'
import { useTemplateStyles, useHeadingClass, useBodyClass } from '../template-context'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/** Only allow http(s) image URLs */
function safeImgSrc(url: string | undefined | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return undefined
}

interface GuestPhoto {
  id: string
  url: string
  caption: string | null
  uploaderName: string | null
  createdAt: Date | string
}

interface GallerySectionProps {
  title: string
  content: GalleryContent
  photos: WebsitePhoto[]
  slug: string
  guestPhotos?: GuestPhoto[]
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadState {
  status: UploadStatus
  progress: number
  error: string | null
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]
const MAX_FILE_SIZE = 20 * 1024 * 1024

export function GallerySection({
  title,
  content,
  photos,
  slug,
  guestPhotos = [],
}: GallerySectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const columns = content.columns ?? 3

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploaderName, setUploaderName] = useState('')
  const [uploaderEmail, setUploaderEmail] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    error: null,
  })
  const [uploadedCount, setUploadedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false
      if (f.size > MAX_FILE_SIZE) return false
      return true
    })
    setSelectedFiles((prev) => [...prev, ...valid])
    // Reset the file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const uploadPhotos = async () => {
    if (!uploaderName.trim() || selectedFiles.length === 0) return

    setUploadState({ status: 'uploading', progress: 0, error: null })
    setUploadedCount(0)

    const total = selectedFiles.length
    let completed = 0

    for (const file of selectedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('uploaderName', uploaderName.trim())
        if (uploaderEmail.trim()) {
          formData.append('uploaderEmail', uploaderEmail.trim())
        }

        const res = await fetch(
          `${API_URL}/website-public/${encodeURIComponent(slug)}/photos/upload`,
          { method: 'POST', body: formData },
        )

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error ?? 'Upload failed')
        }

        completed++
        setUploadedCount(completed)
        setUploadState((prev) => ({
          ...prev,
          progress: Math.round((completed / total) * 100),
        }))
      } catch (err) {
        setUploadState({
          status: 'error',
          progress: Math.round((completed / total) * 100),
          error: err instanceof Error ? err.message : 'Upload failed',
        })
        return
      }
    }

    setUploadState({ status: 'success', progress: 100, error: null })
    setSelectedFiles([])
  }

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0, error: null })
    setSelectedFiles([])
    setUploadedCount(0)
  }

  // Combine curated photos and approved guest photos for display
  const allPhotos = [
    ...photos,
    ...guestPhotos.map((gp) => ({
      id: gp.id,
      url: gp.url,
      altText: gp.uploaderName ? `Photo by ${gp.uploaderName}` : null,
      sectionId: null,
      r2Key: '',
      fileName: '',
      mimeType: '',
      fileSize: 0,
      width: null,
      height: null,
      sortOrder: 0,
      createdAt: gp.createdAt,
    })),
  ]

  const renderPhotoGrid = (
    photoList: (WebsitePhoto | { id: string; url: string; altText: string | null })[],
  ) => {
    if (photoList.length === 0) {
      return (
        <p className={`text-center ${bodyClass}`} style={{ color: `${colors.primary}99` }}>
          No photos yet. Be the first to share!
        </p>
      )
    }

    if (content.layout === 'masonry') {
      return (
        <div className={`columns-1 gap-4 sm:columns-2 lg:columns-${columns}`}>
          {photoList.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="mb-4 break-inside-avoid overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeImgSrc(photo.url)}
                alt={'altText' in photo ? (photo.altText ?? '') : ''}
                className="w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      )
    }

    return (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`,
        }}
      >
        {photoList.map((photo, i) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="aspect-square overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeImgSrc(photo.url)}
              alt={'altText' in photo ? (photo.altText ?? '') : ''}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>

        {renderPhotoGrid(allPhotos)}

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          {!showUploadForm && uploadState.status !== 'success' && (
            <div className="text-center">
              <button
                onClick={() => setShowUploadForm(true)}
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 ${bodyClass}`}
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                Share Your Photos
              </button>
            </div>
          )}

          {showUploadForm && uploadState.status !== 'success' && (
            <div
              className="mx-auto max-w-lg rounded-xl border p-6"
              style={{
                borderColor: `${colors.primary}20`,
                backgroundColor: `${colors.background}`,
              }}
            >
              <h3
                className={`mb-4 text-lg font-semibold ${headingClass}`}
                style={{ color: colors.primary }}
              >
                Share Your Photos
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label
                    className={`mb-1 block text-sm ${bodyClass}`}
                    style={{ color: colors.primary }}
                  >
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={100}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                    style={{
                      borderColor: `${colors.primary}30`,
                      color: colors.primary,
                      backgroundColor: colors.background,
                    }}
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label
                    className={`mb-1 block text-sm ${bodyClass}`}
                    style={{ color: colors.primary }}
                  >
                    Email <span style={{ color: `${colors.primary}60` }}>(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={uploaderEmail}
                    onChange={(e) => setUploaderEmail(e.target.value)}
                    placeholder="your@email.com"
                    maxLength={255}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
                    style={{
                      borderColor: `${colors.primary}30`,
                      color: colors.primary,
                      backgroundColor: colors.background,
                    }}
                  />
                </div>

                {/* File Selection */}
                <div>
                  <label
                    className={`mb-1 block text-sm ${bodyClass}`}
                    style={{ color: colors.primary }}
                  >
                    Photos <span className="text-red-500">*</span>
                  </label>
                  <div
                    className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-solid"
                    style={{ borderColor: `${colors.primary}30` }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto mb-2"
                      style={{ color: `${colors.primary}60` }}
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <p className={`text-sm ${bodyClass}`} style={{ color: `${colors.primary}80` }}>
                      Click to select photos
                    </p>
                    <p
                      className={`mt-1 text-xs ${bodyClass}`}
                      style={{ color: `${colors.primary}50` }}
                    >
                      JPG, PNG, GIF, WebP, HEIC - Max 20MB each
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className={`text-sm font-medium ${bodyClass}`}
                      style={{ color: colors.primary }}
                    >
                      {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {selectedFiles.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="flex items-center justify-between rounded px-2 py-1 text-sm"
                          style={{ backgroundColor: `${colors.primary}08` }}
                        >
                          <span
                            className="truncate"
                            style={{ color: colors.primary, maxWidth: '80%' }}
                          >
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(i)}
                            className="ml-2 flex-shrink-0 rounded p-1 transition-colors hover:bg-red-100"
                            aria-label={`Remove ${file.name}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ color: '#ef4444' }}
                            >
                              <line x1="18" x2="6" y1="6" y2="18" />
                              <line x1="6" x2="18" y1="6" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploadState.status === 'uploading' && (
                  <div className="space-y-2">
                    <div
                      className="h-2 overflow-hidden rounded-full"
                      style={{ backgroundColor: `${colors.primary}15` }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${uploadState.progress}%`,
                          backgroundColor: colors.primary,
                        }}
                      />
                    </div>
                    <p
                      className={`text-center text-sm ${bodyClass}`}
                      style={{ color: `${colors.primary}80` }}
                    >
                      Uploading {uploadedCount} of {selectedFiles.length}...
                    </p>
                  </div>
                )}

                {/* Error */}
                {uploadState.status === 'error' && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-sm text-red-600">
                      {uploadState.error ?? 'Upload failed. Please try again.'}
                    </p>
                    <button
                      onClick={resetUpload}
                      className="mt-2 text-sm font-medium text-red-600 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowUploadForm(false)
                      resetUpload()
                    }}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors hover:opacity-80 ${bodyClass}`}
                    style={{
                      borderColor: `${colors.primary}30`,
                      color: colors.primary,
                    }}
                    disabled={uploadState.status === 'uploading'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={uploadPhotos}
                    disabled={
                      !uploaderName.trim() ||
                      selectedFiles.length === 0 ||
                      uploadState.status === 'uploading'
                    }
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${bodyClass}`}
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.background,
                    }}
                  >
                    {uploadState.status === 'uploading'
                      ? 'Uploading...'
                      : `Upload ${selectedFiles.length || ''} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {uploadState.status === 'success' && (
            <div className="mx-auto max-w-lg text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: colors.primary }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p
                className={`text-lg font-medium ${headingClass}`}
                style={{ color: colors.primary }}
              >
                Photos uploaded!
              </p>
              <p className={`mt-1 text-sm ${bodyClass}`} style={{ color: `${colors.primary}80` }}>
                Your photos will appear after the couple reviews them.
              </p>
              <button
                onClick={() => {
                  resetUpload()
                  setShowUploadForm(false)
                }}
                className={`mt-4 rounded-lg px-6 py-2 text-sm font-medium transition-opacity hover:opacity-90 ${bodyClass}`}
                style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                }}
              >
                Upload More
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
