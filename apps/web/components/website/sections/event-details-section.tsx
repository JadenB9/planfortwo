'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Calendar } from 'lucide-react'
import type { EventDetailsContent } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

interface EventDetailsSectionProps {
  title: string
  content: EventDetailsContent
}

export function EventDetailsSection({ title, content }: EventDetailsSectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.sectionBackground }}>
      <div className="mx-auto max-w-4xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        <div className="grid gap-8 sm:grid-cols-2">
          {content.events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-background rounded-2xl p-6 shadow-sm"
            >
              <h3
                className={`text-xl font-semibold ${headingClass}`}
                style={{ ...headingFont, color: colors.primary }}
              >
                {event.name}
              </h3>
              <div className={`mt-4 space-y-2 ${bodyClass}`} style={bodyFont}>
                {event.date && (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: `${colors.primary}BB` }}
                  >
                    <Calendar className="h-4 w-4" style={{ color: colors.accent }} />
                    {event.date}
                  </div>
                )}
                {event.time && (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: `${colors.primary}BB` }}
                  >
                    <Clock className="h-4 w-4" style={{ color: colors.accent }} />
                    {event.time}
                  </div>
                )}
                <div
                  className="flex items-start gap-2 text-sm"
                  style={{ color: `${colors.primary}BB` }}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.accent }} />
                  <div>
                    <p className="font-medium">{event.venue}</p>
                    <p>{event.address}</p>
                  </div>
                </div>
                {event.description && (
                  <p className="mt-2 text-sm" style={{ color: `${colors.primary}99` }}>
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
