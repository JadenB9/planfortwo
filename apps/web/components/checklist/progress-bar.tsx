'use client'

import { motion } from 'framer-motion'
import { springSmooth } from '@/lib/animations'

interface ProgressBarProps {
  completed: number
  total: number
  className?: string
}

export function ProgressBar({ completed, total, className = '' }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {completed} of {total} tasks complete
        </span>
        <motion.span
          className="text-wedding-600 font-semibold"
          key={percentage}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {percentage}%
        </motion.span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="bg-wedding-600 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', ...springSmooth }}
        />
      </div>
    </div>
  )
}
