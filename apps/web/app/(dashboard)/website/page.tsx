'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { useWebsite } from '@/hooks/use-website'
import { useWedding } from '@/hooks/use-wedding'
import { springSmooth } from '@/lib/animations'
import { api } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { TemplateSelector } from '@/components/website/editor/template-selector'
import { SectionManager } from '@/components/website/editor/section-manager'
import { SettingsPanel } from '@/components/website/editor/settings-panel'
import { PublishToggle } from '@/components/website/editor/publish-toggle'
import { AnalyticsDashboard } from '@/components/website/analytics/analytics-dashboard'
import { SectionEditorModal } from '@/components/website/editor/section-editor-modal'
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
} from '@planfortwo/types'

export default function WebsitePage() {
  const { data, features } = useWedding()
  const { getToken } = useAuth()
  const wedding = data?.wedding ?? null
  const weddingId = wedding?.id ?? null
  const { config, sections, loading, refetch, analytics } = useWebsite({ weddingId })
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null)
  const [editorContent, setEditorContent] = useState<Record<string, unknown>>({})
  const [activeTab, setActiveTab] = useState('design')

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
      const token = await getToken()
      if (!token) return
      await api.websiteSections.update(sectionId, weddingId, { isVisible }, token)
      await refetch()
    },
    [weddingId, getToken, refetch],
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

  const handleSectionReorder = useCallback(
    async (reordered: { id: string; sortOrder: number }[]) => {
      if (!weddingId) return
      const token = await getToken()
      if (!token) return
      await api.websiteSections.reorder(weddingId, { sections: reordered }, token)
      await refetch()
    },
    [weddingId, getToken, refetch],
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
      default:
        return <p className="text-sm text-gray-500">No editor available for this section type.</p>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Wedding Website</h1>
        <PublishToggle
          isPublished={!!config.publishedAt}
          subdomain={config.subdomain}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="mt-6">
          <TemplateSelector selectedId={config.templateId} onSelect={handleTemplateChange} />
        </TabsContent>

        <TabsContent value="sections" className="mt-6">
          <SectionManager
            sections={sections}
            onToggleVisibility={handleToggleVisibility}
            onEdit={handleSectionEdit}
            onReorder={handleSectionReorder}
          />
          <SectionEditorModal
            open={!!editingSection}
            onClose={() => setEditingSection(null)}
            onSaved={() => {
              setEditingSection(null)
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
    </motion.div>
  )
}
