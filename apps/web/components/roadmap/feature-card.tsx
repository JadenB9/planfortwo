'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { FeatureProgress } from '@planfortwo/types'
import { ProgressBar } from './progress-bar'
import { scaleIn, springSmooth } from '@/lib/animations'
import {
  CheckSquare,
  Users,
  DollarSign,
  Globe,
  Armchair,
  Store,
  CalendarDays,
  Church,
  Music,
  Camera,
  Gift,
  Plane,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const FEATURE_ICONS: Record<string, LucideIcon> = {
  checklist: CheckSquare,
  guests: Users,
  budget: DollarSign,
  website: Globe,
  seating: Armchair,
  vendors: Store,
  events: CalendarDays,
  ceremony: Church,
  music: Music,
  photos: Camera,
  registry: Gift,
  honeymoon: Plane,
  communication: Mail,
}

const DEFAULT_STATUS_STYLE = { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Not Started' }

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  not_started: DEFAULT_STATUS_STYLE,
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
}

interface FeatureCardProps {
  feature: FeatureProgress
  isSettingsMode?: boolean
  onProgressChange?: (key: string, value: number) => void
  onHiddenToggle?: (key: string) => void
}

export function FeatureCard({
  feature,
  isSettingsMode = false,
  onProgressChange,
  onHiddenToggle,
}: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.key] ?? CheckSquare
  const statusStyle = STATUS_STYLES[feature.status] ?? DEFAULT_STATUS_STYLE

  const cardContent = (
    <>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="bg-wedding-50 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-wedding-600 h-5 w-5" />
          </div>
          <h3 className="truncate text-sm font-semibold text-foreground">{feature.label}</h3>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {isSettingsMode && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onHiddenToggle?.(feature.key)
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground"
              title={feature.isHidden ? 'Show feature' : 'Hide feature'}
            >
              {feature.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{feature.description}</p>

      {isSettingsMode ? (
        <div className="mb-1">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={feature.progress}
            onChange={(e) => onProgressChange?.(feature.key, Number(e.target.value))}
            className="accent-wedding-600 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Auto: {feature.autoProgress}%</span>
            <span className="font-medium text-muted-foreground">{Math.round(feature.progress)}%</span>
          </div>
        </div>
      ) : (
        <>
          <ProgressBar progress={feature.progress} />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{feature.itemCount} items</span>
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(feature.progress)}%
            </span>
          </div>
        </>
      )}
    </>
  )

  if (isSettingsMode) {
    return (
      <motion.div
        variants={scaleIn}
        transition={springSmooth}
        className={`rounded-2xl border border-border bg-white p-5 shadow-sm transition-opacity ${
          feature.isHidden ? 'opacity-50' : ''
        }`}
      >
        {cardContent}
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={scaleIn}
      transition={springSmooth}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
    >
      <Link
        href={feature.href}
        className="hover:border-wedding-200 block rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors"
      >
        {cardContent}
      </Link>
    </motion.div>
  )
}
