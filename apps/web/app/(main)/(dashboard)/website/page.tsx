'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useWebsite } from '@/hooks/use-website'
import { useWedding } from '@/hooks/use-wedding'
import { springSmooth } from '@/lib/animations'
import { api } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TemplateSelector } from '@/components/website/editor/template-selector'
import { SectionManager } from '@/components/website/editor/section-manager'
import { SettingsPanel } from '@/components/website/editor/settings-panel'
import { PublishToggle } from '@/components/website/editor/publish-toggle'
import { AnalyticsDashboard } from '@/components/website/analytics/analytics-dashboard'
import { SectionEditorModal } from '@/components/website/editor/section-editor-modal'
import dynamic from 'next/dynamic'
import { HeroEditor } from '@/components/website/editor/hero-editor'
import { OurStoryEditor } from '@/components/website/editor/our-story-editor'
import { EventDetailsEditor } from '@/components/website/editor/event-details-editor'
import { WeddingPartyEditor } from '@/components/website/editor/wedding-party-editor'
import { GalleryEditor } from '@/components/website/editor/gallery-editor'
import { TravelEditor } from '@/components/website/editor/travel-editor'
import { RegistryEditor } from '@/components/website/editor/registry-editor'
import { RsvpEditor } from '@/components/website/editor/rsvp-editor'
import { ScheduleEditor } from '@/components/website/editor/schedule-editor'
import { GuestbookEditor } from '@/components/website/editor/guestbook-editor'
import { CustomEditor } from '@/components/website/editor/custom-editor'
import { FaqEditor } from '@/components/website/editor/faq-editor'
import { ThingsToDoEditor } from '@/components/website/editor/things-to-do-editor'
import { SongRequestsEditor } from '@/components/website/editor/song-requests-editor'
import { PrayersEditor } from '@/components/website/editor/prayers-editor'
import type { PreviewMode } from '@/components/website/editor/website-preview'
import type { WebsiteSection } from '@planfortwo/types'
import type {
  HeroContent,
  OurStoryContent,
  EventDetailsContent,
  WeddingPartyContent,
  GalleryContent,
  TravelContent,
  RegistryContent,
  FaqContent,
  ThingsToDoContent,
  RsvpSectionContent,
  ScheduleContent,
  GuestbookSectionContent,
  CustomSectionContent,
  SongRequestsSectionContent,
  PrayersSectionContent,
} from '@planfortwo/types'

const WebsitePreview = dynamic(
  () => import('@/components/website/editor/website-preview').then((m) => m.WebsitePreview),
  { ssr: false },
)

const VALID_TABS = ['design', 'sections', 'settings', 'analytics']

export default function WebsitePage() {
  const { data, features } = useWedding()
  const { getToken } = useAuth()
  const wedding = data?.wedding ?? null
  const weddingId = wedding?.id ?? null
  const { config, sections, setSections, photos, loading, refetch, analytics } = useWebsite({
    weddingId,
  })
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null)
  const [editorContent, setEditorContent] = useState<Record<string, unknown>>({})
  const [previewMode, setPreviewMode] = useState<PreviewMode>('phone')

  // Tab persistence: read from URL on mount, write to URL on change
  const [activeTab, setActiveTabState] = useState('design')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTabState(tab)
    }
  }, [])

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState(null, '', url.toString())
  }, [])

  useEffect(() => {
    if (editingSection) {
      setEditorContent((editingSection.content ?? {}) as Record<string, unknown>)
    }
  }, [editingSection])

  const handleCreate = useCallback(async () => {
    if (!weddingId) return
    const token = await getToken()
    if (!token) return
    const slug =
      wedding?.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ?? 'our-wedding'
    await api.websiteConfig.create({ weddingId, templateId: 'classic', subdomain: slug }, token)
    await refetch()
  }, [weddingId, getToken, refetch, wedding?.name])

  const handleTemplateChange = useCallback(
    async (templateId: string) => {
      if (!weddingId || !config) return
      const token = await getToken()
      if (!token) return
      await api.websiteConfig.update(
        config.id,
        weddingId,
        { templateId: templateId as 'classic' },
        token,
      )
      await refetch()
    },
    [weddingId, config, getToken, refetch],
  )

  const handleConfigUpdate = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!weddingId || !config) return
      const token = await getToken()
      if (!token) return
      await api.websiteConfig.update(config.id, weddingId, updates, token)
      await refetch()
    },
    [weddingId, config, getToken, refetch],
  )

  const handleToggleVisibility = useCallback(
    async (sectionId: string, isVisible: boolean) => {
      if (!weddingId) return
      // Optimistic update — toggle instantly in UI
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, isVisible } : s)))
      const token = await getToken()
      if (!token) return
      try {
        await api.websiteSections.update(sectionId, weddingId, { isVisible }, token)
      } catch {
        await refetch()
      }
    },
    [weddingId, getToken, setSections, refetch],
  )

  const handlePublish = useCallback(async () => {
    if (!weddingId || !config) return
    const token = await getToken()
    if (!token) return
    await api.websiteConfig.publish(config.id, weddingId, token)
    await refetch()
  }, [weddingId, config, getToken, refetch])

  const handleUnpublish = useCallback(async () => {
    if (!weddingId || !config) return
    const token = await getToken()
    if (!token) return
    await api.websiteConfig.unpublish(config.id, weddingId, token)
    await refetch()
  }, [weddingId, config, getToken, refetch])

  const handleCheckSubdomain = useCallback(
    async (subdomain: string): Promise<boolean> => {
      const token = await getToken()
      if (!token) return false
      try {
        const res = await api.websiteConfig.checkSubdomain(subdomain, token, weddingId ?? undefined)
        return (res as { data: { available: boolean } }).data.available
      } catch {
        return false
      }
    },
    [getToken, weddingId],
  )

  const handleSectionEdit = useCallback((section: WebsiteSection) => {
    setEditingSection(section)
  }, [])

  const handleAddBuiltIn = useCallback(
    async (sectionType: string, title: string, content: Record<string, unknown>) => {
      if (!weddingId) return
      const token = await getToken()
      if (!token) return
      await api.websiteSections.addBuiltIn(weddingId, { sectionType, title, content }, token)
      await refetch()
    },
    [weddingId, getToken, refetch],
  )

  // Auto-create song_requests and prayers sections if missing (default hidden)
  const defaultSectionsCreated = useRef(false)
  const DEFAULT_SECTIONS = useRef([
    {
      sectionType: 'song_requests',
      title: 'Song Requests',
      content: { message: 'Help us build our playlist!', showApproved: false },
    },
    {
      sectionType: 'prayers',
      title: 'Prayers',
      content: {
        requireApproval: true,
        message:
          'We would be honored to have your prayers and blessings as we begin this new chapter together.',
      },
    },
  ])

  useEffect(() => {
    if (!weddingId || !config || loading || defaultSectionsCreated.current) return
    if (sections.length === 0) return
    const existingTypes = new Set<string>(sections.map((s) => s.sectionType))
    const missing = DEFAULT_SECTIONS.current.filter((d) => !existingTypes.has(d.sectionType))
    if (missing.length === 0) return

    defaultSectionsCreated.current = true
    void (async () => {
      const token = await getToken()
      if (!token) return
      for (const section of missing) {
        await api.websiteSections.addBuiltIn(weddingId, section, token)
      }
      await refetch()
    })()
  }, [weddingId, config, loading, sections, getToken, refetch])

  // After default sections are created, toggle them off
  useEffect(() => {
    if (!defaultSectionsCreated.current || !weddingId) return
    const newSections = sections.filter(
      (s) => (s.sectionType === 'song_requests' || s.sectionType === 'prayers') && s.isVisible,
    )
    if (newSections.length > 0) {
      defaultSectionsCreated.current = false
      for (const section of newSections) {
        void handleToggleVisibility(section.id, false)
      }
    }
  }, [sections, weddingId, handleToggleVisibility])

  const handleSectionReorder = useCallback(
    async (reordered: { id: string; sortOrder: number }[]) => {
      if (!weddingId) return
      // Optimistic update — apply new sort order instantly in UI
      const orderMap = new Map(reordered.map((r) => [r.id, r.sortOrder]))
      setSections((prev) =>
        prev.map((s) => {
          const newOrder = orderMap.get(s.id)
          return newOrder !== undefined ? { ...s, sortOrder: newOrder } : s
        }),
      )
      const token = await getToken()
      if (!token) return
      try {
        await api.websiteSections.reorder(weddingId, { sections: reordered }, token)
      } catch {
        await refetch()
      }
    },
    [weddingId, getToken, setSections, refetch],
  )

  const renderEditor = (
    sectionType: string,
    content: Record<string, unknown>,
    onChange: (c: Record<string, unknown>) => void,
  ) => {
    switch (sectionType) {
      case 'hero':
        return (
          <HeroEditor
            content={content as unknown as HeroContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'our_story':
        return (
          <OurStoryEditor
            content={content as unknown as OurStoryContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'event_details':
        return (
          <EventDetailsEditor
            content={content as unknown as EventDetailsContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'wedding_party':
        return (
          <WeddingPartyEditor
            content={content as unknown as WeddingPartyContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'gallery':
        return (
          <GalleryEditor
            content={content as unknown as GalleryContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
            getToken={getToken}
            weddingId={weddingId ?? ''}
            sectionId={editingSection?.id ?? ''}
          />
        )
      case 'travel':
        return (
          <TravelEditor
            content={content as unknown as TravelContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'registry':
        return (
          <RegistryEditor
            content={content as unknown as RegistryContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
            getToken={getToken}
            weddingId={weddingId ?? ''}
          />
        )
      case 'rsvp':
        return (
          <RsvpEditor
            content={content as unknown as RsvpSectionContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'schedule':
        return (
          <ScheduleEditor
            content={content as unknown as ScheduleContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'guestbook':
        return (
          <GuestbookEditor
            content={content as unknown as GuestbookSectionContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'custom':
        return (
          <CustomEditor
            content={content as unknown as CustomSectionContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'faq':
        return (
          <FaqEditor
            content={content as unknown as FaqContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'things_to_do':
        return (
          <ThingsToDoEditor
            content={content as unknown as ThingsToDoContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'song_requests':
        return (
          <SongRequestsEditor
            content={content as unknown as SongRequestsSectionContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      case 'prayers':
        return (
          <PrayersEditor
            content={content as unknown as PrayersSectionContent}
            onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
          />
        )
      default:
        return <p className="text-sm text-gray-500">No editor available for this section type.</p>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  if (!config) {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center px-4"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ...springSmooth }}
      >
        <h1 className="font-serif text-3xl font-bold text-gray-900">Wedding Website</h1>
        <p className="mt-2 text-gray-600">Create your personalized wedding website</p>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button className="mt-6" onClick={handleCreate} disabled={!features?.canWebsiteBuilder}>
            {features?.canWebsiteBuilder ? 'Create Website' : 'Upgrade to Create Website'}
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  const weddingDate = wedding?.date ? new Date(wedding.date) : null

  return (
    <motion.div
      className="flex h-full flex-col px-6 pt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Wedding Website</h1>
        <PublishToggle
          isPublished={!!config.publishedAt}
          subdomain={config.subdomain}
          accessToken={config.accessToken}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        {/* Editor panel — scrollable independently */}
        <div className="min-w-0 flex-1 overflow-y-auto pb-6 pr-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="mt-6">
              <TemplateSelector
                selectedId={config.templateId}
                onSelect={handleTemplateChange}
                customColors={config.customColors}
                savedPalettes={config.savedPalettes ?? null}
                fontPair={config.fontPair}
                onCustomize={(updates) => handleConfigUpdate(updates)}
              />
            </TabsContent>

            <TabsContent value="sections" className="mt-6">
              <SectionManager
                sections={sections}
                onToggleVisibility={handleToggleVisibility}
                onEdit={handleSectionEdit}
                onReorder={handleSectionReorder}
                onAddBuiltIn={handleAddBuiltIn}
              />
              <SectionEditorModal
                open={!!editingSection}
                onClose={() => setEditingSection(null)}
                onSaved={() => {
                  void refetch()
                }}
                sectionId={editingSection?.id ?? ''}
                sectionTitle={editingSection?.title ?? ''}
                sectionType={editingSection?.sectionType ?? ''}
                content={editorContent}
                getToken={getToken}
                weddingId={weddingId ?? ''}
              >
                {editingSection &&
                  renderEditor(editingSection.sectionType, editorContent, setEditorContent)}
              </SectionEditorModal>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsPanel
                config={config}
                onUpdate={handleConfigUpdate}
                onCheckSubdomain={handleCheckSubdomain}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AnalyticsDashboard
                analytics={analytics}
                canAccess={features?.canWebsiteAnalytics ?? false}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Live preview panel — stays fixed in place, scrollable within */}
        <div
          className="hidden min-h-0 shrink-0 transition-all duration-300 xl:block"
          style={{ width: previewMode === 'desktop' ? '520px' : '300px' }}
        >
          <div className="h-full overflow-hidden rounded-lg border shadow-sm">
            <WebsitePreview
              templateId={config.templateId}
              customColors={config.customColors}
              fontPair={config.fontPair}
              sections={sections}
              photos={photos}
              weddingName={wedding?.name ?? 'Our Wedding'}
              weddingDate={weddingDate}
              slug={config.subdomain ?? ''}
              editingSectionId={editingSection?.id}
              editingContent={editingSection ? editorContent : undefined}
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
