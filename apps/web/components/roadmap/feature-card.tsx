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

const DEFAULT_STATUS_STYLE = { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Started' }

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  not_started: DEFAULT_STATUS_STYLE,
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
}

interface FeatureCardProps {
  feature: FeatureProgress
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = FEATURE_ICONS[feature.key] ?? CheckSquare
  const statusStyle = STATUS_STYLES[feature.status] ?? DEFAULT_STATUS_STYLE

  return (
    <motion.div
      variants={scaleIn}
      transition={springSmooth}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
    >
      <Link
        href={feature.href}
        className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-wedding-200"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-wedding-50">
              <Icon className="h-5 w-5 text-wedding-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{feature.label}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>

        <p className="mb-3 text-xs text-gray-500">{feature.description}</p>

        <ProgressBar progress={feature.progress} />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">{feature.itemCount} items</span>
          <span className="text-xs font-medium text-gray-600">{Math.round(feature.progress)}%</span>
        </div>
      </Link>
    </motion.div>
  )
}
