'use client'

import { useState, useCallback } from 'react'
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
import type { WebsiteSection } from '@planfortwo/types'

export default function WebsitePage() {
  const { data, features } = useWedding()
  const { getToken } = useAuth()
  const wedding = data?.wedding ?? null
  const weddingId = wedding?.id ?? null
  const { config, sections, loading, refetch, analytics } = useWebsite({ weddingId })
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null)

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
        const res = await api.websiteConfig.checkSubdomain(subdomain, token)
        return (res as { data: { available: boolean } }).data.available
      } catch {
        return false
      }
    },
    [getToken],
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

      <Tabs defaultValue="design">
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
          {editingSection && (
            <div className="mt-4 rounded-xl border bg-white p-4">
              <p className="text-sm text-gray-500">
                Section editor for &ldquo;{editingSection.title}&rdquo; — coming in next iteration
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setEditingSection(null)}
              >
                Close
              </Button>
            </div>
          )}
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
