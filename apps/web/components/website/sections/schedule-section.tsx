'use client'

import { motion } from 'framer-motion'
import type { ScheduleContent } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

interface ScheduleSectionProps {
  title: string
  content: ScheduleContent
}

export function ScheduleSection({ title, content }: ScheduleSectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-2xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        <div className="relative">
          <div
            className="absolute left-6 top-0 h-full w-px"
            style={{ backgroundColor: colors.secondary }}
          />
          {content.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative mb-8 pl-16"
            >
              <div
                className="absolute left-4 top-1 h-4 w-4 rounded-full border-2"
                style={{ borderColor: colors.accent, backgroundColor: colors.background }}
              />
              <p
                className={`text-sm font-medium ${bodyClass}`}
                style={{ ...bodyFont, color: colors.accent }}
              >
                {item.time}
              </p>
              <h3
                className={`mt-1 text-lg font-semibold ${headingClass}`}
                style={{ ...headingFont, color: colors.primary }}
              >
                {item.title}
              </h3>
              {item.description && (
                <p
                  className={`mt-1 text-sm ${bodyClass}`}
                  style={{ ...bodyFont, color: `${colors.primary}BB` }}
                >
                  {item.description}
                </p>
              )}
              {item.location && (
                <p
                  className={`mt-1 text-xs ${bodyClass}`}
                  style={{ ...bodyFont, color: `${colors.primary}99` }}
                >
                  {item.location}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
