'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { TemplateProvider } from '@/components/website/template-context'
import { SectionRenderer } from '@/components/website/sections/section-renderer'
import type { WebsiteSection, WebsitePhoto, CustomColors } from '@planfortwo/types'
import { Monitor } from 'lucide-react'

const PREVIEW_VIEWPORT_WIDTH = 1280

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&family=Cormorant+Garamond:wght@400;600;700&family=Fira+Sans:wght@300;400;600&family=Great+Vibes&family=Montserrat:wght@300;400;600;700&family=Josefin+Sans:wght@300;400;600;700&family=Open+Sans:wght@300;400;600;700&family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@300;400;600;700&family=Dancing+Script:wght@400;700&family=Nunito:wght@300;400;600;700&display=swap'

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
}: WebsitePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [contentHeight, setContentHeight] = useState(800)

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
        setScale(entry.contentRect.width / PREVIEW_VIEWPORT_WIDTH)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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
      return visible.map((s) =>
        s.id === editingSectionId ? { ...s, content: editingContent } : s,
      )
    }
    return visible
  }, [sections, editingSectionId, editingContent])

  const scaledHeight = contentHeight * scale

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-gray-50/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Live Preview</span>
        </div>
        <span className="text-[10px] text-gray-400">{Math.round(scale * 100)}%</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-100">
        {previewSections.length > 0 ? (
          <div style={{ height: `${scaledHeight}px`, position: 'relative' }}>
            <div
              ref={contentRef}
              className="pointer-events-none"
              style={{
                width: `${PREVIEW_VIEWPORT_WIDTH}px`,
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
              <Monitor className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">No visible sections</p>
              <p className="mt-1 text-xs text-gray-300">Enable sections to see your preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
