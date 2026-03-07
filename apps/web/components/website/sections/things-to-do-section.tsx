'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { ThingsToDoContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface ThingsToDoSectionProps {
  title: string
  content: ThingsToDoContent
}

export function ThingsToDoSection({ title, content }: ThingsToDoSectionProps) {
  const { colors, fontPair } = useTemplateStyles()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-4xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {content.activities.map((activity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6"
              style={{ backgroundColor: `${colors.secondary}44` }}
            >
              {activity.category && (
                <span
                  className={`text-xs font-medium uppercase tracking-wider ${fontPair.bodyClass}`}
                  style={{ color: colors.accent }}
                >
                  {activity.category}
                </span>
              )}
              <h3
                className={`mt-1 text-lg font-semibold ${fontPair.headingClass}`}
                style={{ color: colors.primary }}
              >
                {activity.name}
              </h3>
              {activity.description && (
                <p
                  className={`mt-2 text-sm ${fontPair.bodyClass}`}
                  style={{ color: `${colors.primary}BB` }}
                >
                  {activity.description}
                </p>
              )}
              {activity.url && /^https?:\/\//i.test(activity.url) && (
                <a
                  href={activity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: colors.accent }}
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
