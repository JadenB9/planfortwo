'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { TemplateProvider } from '@/components/website/template-context'
import { SectionRenderer } from '@/components/website/sections/section-renderer'
import type { WebsiteSection, WebsitePhoto, CustomColors } from '@planfortwo/types'
import { Monitor, Smartphone } from 'lucide-react'

const DESKTOP_VIEWPORT_WIDTH = 1280
const PHONE_VIEWPORT_WIDTH = 390

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Fira+Sans:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Great+Vibes&family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Josefin+Sans:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Dancing+Script:wght@400;700&family=Nunito:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Raleway:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Abril+Fatface&family=Poppins:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Cinzel:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Sacramento&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Quicksand:wght@300;400;500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Spectral:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap'

export type PreviewMode = 'phone' | 'desktop'

interface WebsitePreviewProps {
  templateId: string
  customColors: CustomColors | null
  fontPair: string
  sections: WebsiteSection[]
  photos: WebsitePhoto[]
  weddingName: string
  weddingDate: Date | null
  slug: string
  editingSectionId?: string | null
  editingContent?: Record<string, unknown>
  previewMode?: PreviewMode
  onPreviewModeChange?: (mode: PreviewMode) => void
}

export function WebsitePreview({
  templateId,
  customColors,
  fontPair,
  sections,
  photos,
  weddingName,
  weddingDate,
  slug,
  editingSectionId,
  editingContent,
  previewMode = 'phone',
  onPreviewModeChange,
}: WebsitePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [contentHeight, setContentHeight] = useState(800)

  const viewportWidth = previewMode === 'desktop' ? DESKTOP_VIEWPORT_WIDTH : PHONE_VIEWPORT_WIDTH

  // Load Google Fonts for section rendering
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.getElementById('preview-gfonts')) return
    const link = document.createElement('link')
    link.id = 'preview-gfonts'
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }, [])

  // Compute scale from container width
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(entry.contentRect.width / viewportWidth)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [viewportWidth])

  // Track content height for proper scrollbar
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Merge editing content into sections for live preview
  const previewSections = useMemo(() => {
    const visible = [...sections]
      .filter((s) => s.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    if (editingSectionId && editingContent) {
      return visible.map((s) => (s.id === editingSectionId ? { ...s, content: editingContent } : s))
    }
    return visible
  }, [sections, editingSectionId, editingContent])

  const scaledHeight = contentHeight * scale

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPreviewModeChange?.('phone')}
            className={`rounded p-1 transition-colors ${
              previewMode === 'phone'
                ? 'bg-blue-100 text-blue-600'
                : 'text-muted-foreground hover:bg-muted hover:text-muted-foreground'
            }`}
            title="Phone view"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange?.('desktop')}
            className={`rounded p-1 transition-colors ${
              previewMode === 'desktop'
                ? 'bg-blue-100 text-blue-600'
                : 'text-muted-foreground hover:bg-muted hover:text-muted-foreground'
            }`}
            title="Desktop view"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <span className="ml-1 text-[10px] text-muted-foreground">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-muted">
        {previewSections.length > 0 ? (
          <div style={{ height: `${scaledHeight}px`, position: 'relative', overflow: 'hidden' }}>
            <div
              ref={contentRef}
              className="pointer-events-none"
              style={{
                width: `${viewportWidth}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <TemplateProvider
                templateId={templateId}
                customColors={customColors}
                fontPairId={fontPair}
              >
                {previewSections.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    photos={photos}
                    guestbookEntries={[]}
                    prayerEntries={[]}
                    weddingName={weddingName}
                    weddingDate={weddingDate}
                    slug={slug}
                  />
                ))}
              </TemplateProvider>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Monitor className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No visible sections</p>
              <p className="mt-1 text-xs text-muted-foreground/50">Enable sections to see your preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
