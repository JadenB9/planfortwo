'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import type { PlanningProgress, FeatureProgress } from '@planfortwo/types'
import { api } from '@/lib/api'
import { OverallProgressRing } from '@/components/roadmap/overall-progress-ring'
import { FeatureCard } from '@/components/roadmap/feature-card'
import { staggerGrid, fadeInUp, springSmooth } from '@/lib/animations'
import { Settings, X } from 'lucide-react'

export default function RoadmapPage() {
  const { getToken } = useAuth()
  const [progress, setProgress] = useState<PlanningProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [settingsMode, setSettingsMode] = useState(false)
  const [localOverrides, setLocalOverrides] = useState<Record<string, number>>({})
  const [localHidden, setLocalHidden] = useState<string[]>([])
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function loadWedding() {
      const token = await getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.weddings.mine(token)
        setWeddingId(res.data.wedding.id)
      } catch (err) {
        console.error('loadWedding error:', err)
        setLoading(false)
      }
    }
    loadWedding()
  }, [getToken])

  useEffect(() => {
    async function loadProgress() {
      if (!weddingId) return
      const token = await getToken()
      if (!token) return
      try {
        const res = await api.progress.get(weddingId, token)
        setProgress(res.data)
        if (res.data.preferences) {
          setLocalOverrides(res.data.preferences.overrides)
          setLocalHidden(res.data.preferences.hidden)
        }
      } catch (err) {
        console.error('loadProgress error:', err)
        setError('Unable to load your planning progress. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [weddingId, getToken])

  const savePreferences = useCallback(
    (overrides: Record<string, number>, hidden: string[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        if (!weddingId) return
        const token = await getToken()
        if (!token) return
        try {
          await api.progress.updatePreferences({ weddingId, overrides, hidden }, token)
        } catch {
          // Save failed silently
        }
      }, 500)
    },
    [weddingId, getToken],
  )

  const handleProgressChange = useCallback(
    (key: string, value: number) => {
      setLocalOverrides((prev) => {
        const next = { ...prev, [key]: value }
        savePreferences(next, localHidden)
        return next
      })
    },
    [localHidden, savePreferences],
  )

  const handleHiddenToggle = useCallback(
    (key: string) => {
      setLocalHidden((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        savePreferences(localOverrides, next)
        return next
      })
    },
    [localOverrides, savePreferences],
  )

  const effectiveFeatures: FeatureProgress[] | null = progress
    ? progress.features.map((f) => {
        const override = localOverrides[f.key]
        const effectiveProgress = override !== undefined ? override : f.autoProgress
        const isHidden = localHidden.includes(f.key)
        return {
          ...f,
          progress: effectiveProgress,
          status:
            effectiveProgress >= 100
              ? ('completed' as const)
              : effectiveProgress > 0
                ? ('in_progress' as const)
                : ('not_started' as const),
          isHidden,
        }
      })
    : null

  const visibleFeatures = effectiveFeatures?.filter((f) => !f.isHidden) ?? []

  const effectiveOverall =
    visibleFeatures.length > 0
      ? Math.round(visibleFeatures.reduce((sum, f) => sum + f.progress, 0) / visibleFeatures.length)
      : 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              window.location.reload()
            }}
            className="bg-wedding-600 hover:bg-wedding-700 mt-4 inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!progress || !effectiveFeatures) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-gray-900">Planning Roadmap</h2>
          <p className="mt-2 text-sm text-gray-500">
            Complete your wedding setup to see your planning progress here.
          </p>
          <a
            href="/dashboard"
            className="bg-wedding-600 hover:bg-wedding-700 mt-4 inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const displayedFeatures = settingsMode ? effectiveFeatures : visibleFeatures

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={springSmooth}
        className="mb-8 flex items-center justify-between"
      >
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Planning Roadmap</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your wedding planning progress at a glance
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsMode(!settingsMode)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            settingsMode
              ? 'bg-wedding-600 hover:bg-wedding-700 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {settingsMode ? (
            <>
              <X className="h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              Customize
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ ...springSmooth, delay: 0.1 }}
        className="mb-10 flex justify-center"
      >
        <OverallProgressRing progress={effectiveOverall} />
      </motion.div>

      {settingsMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700"
        >
          Drag sliders to set your progress manually. Click the eye icon to hide features you
          don&apos;t need.
        </motion.div>
      )}

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={staggerGrid}
        initial="hidden"
        animate="visible"
      >
        {displayedFeatures.map((feature) => (
          <FeatureCard
            key={feature.key}
            feature={feature}
            isSettingsMode={settingsMode}
            onProgressChange={handleProgressChange}
            onHiddenToggle={handleHiddenToggle}
          />
        ))}
      </motion.div>
    </div>
  )
}
