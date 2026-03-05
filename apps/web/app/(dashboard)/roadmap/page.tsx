'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import type { PlanningProgress } from '@planfortwo/types'
import { api } from '@/lib/api'
import { OverallProgressRing } from '@/components/roadmap/overall-progress-ring'
import { FeatureCard } from '@/components/roadmap/feature-card'
import { staggerGrid, fadeInUp, springSmooth } from '@/lib/animations'

export default function RoadmapPage() {
  const { getToken } = useAuth()
  const [progress, setProgress] = useState<PlanningProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadWedding() {
      const token = await getToken()
      if (!token) return
      try {
        const res = await api.weddings.mine(token)
        setWeddingId(res.data.wedding.id)
      } catch {
        // Wedding not found
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
      } catch {
        // Progress fetch failed
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [weddingId, getToken])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Unable to load planning progress.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={springSmooth}
        className="mb-8 text-center"
      >
        <h1 className="text-2xl font-bold text-gray-900">Planning Roadmap</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your wedding planning progress at a glance
        </p>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ ...springSmooth, delay: 0.1 }}
        className="mb-10 flex justify-center"
      >
        <OverallProgressRing progress={progress.overallProgress} />
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={staggerGrid}
        initial="hidden"
        animate="visible"
      >
        {progress.features.map((feature) => (
          <FeatureCard key={feature.key} feature={feature} />
        ))}
      </motion.div>
    </div>
  )
}
