'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ChecklistTask } from '@planfortwo/types'
import { staggerContainer, listItem, springSmooth } from '@/lib/animations'

interface UpcomingTasksProps {
  tasks: ChecklistTask[]
}

const PRIORITY_STYLES: Record<string, string> = {
  must_do: 'border border-red-200 text-red-600',
  nice_to_have: 'border border-amber-200 text-amber-600',
  optional: 'border border-border text-muted-foreground',
}

const PRIORITY_LABELS: Record<string, string> = {
  must_do: 'Must Do',
  nice_to_have: 'Nice to Have',
  optional: 'Optional',
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const upcoming = tasks.slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <div className="border-border bg-background rounded-2xl border p-6">
        <h3 className="text-foreground font-serif text-lg font-semibold">Upcoming Tasks</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          No upcoming tasks. Your checklist will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="border-border bg-background rounded-2xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-foreground font-serif text-lg font-semibold">Upcoming Tasks</h3>
        <Link
          href="/checklist"
          className="text-wedding-600 hover:text-wedding-700 text-sm font-medium transition-colors"
        >
          View all
        </Link>
      </div>

      <motion.div
        className="space-y-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {upcoming.map((task) => (
          <Link key={task.id} href="/checklist">
            <motion.div
              className="border-border flex items-center justify-between rounded-xl border px-4 py-3"
              variants={listItem}
              transition={{ duration: 0.3, ...springSmooth }}
              whileHover={{ x: 3, borderColor: 'rgb(var(--wedding-200))' }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{task.title}</p>
                {task.dueDate && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Due{' '}
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <span
                className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}
