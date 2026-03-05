'use client'

import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import type { OurStoryContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface OurStorySectionProps {
  title: string
  content: OurStoryContent
}

export function OurStorySection({ title, content }: OurStorySectionProps) {
  const { colors, fontPair } = useTemplateStyles()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-3xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-8 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.body && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`prose mx-auto max-w-none text-center ${fontPair.bodyClass}`}
            style={{ color: colors.primary }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        )}
        {content.timelineEvents.length > 0 && (
          <div className="relative mt-12">
            <div
              className="absolute left-1/2 h-full w-px -translate-x-1/2"
              style={{ backgroundColor: colors.secondary }}
            />
            {content.timelineEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative mb-8 flex ${i % 2 === 0 ? 'justify-end pr-8 sm:pr-12' : 'justify-start pl-8 sm:pl-12'}`}
                style={{ [i % 2 === 0 ? 'marginRight' : 'marginLeft']: '50%' }}
              >
                <div
                  className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: colors.accent, left: i % 2 === 0 ? '100%' : '0%' }}
                />
                <div className="max-w-xs">
                  <p
                    className={`text-sm font-medium ${fontPair.bodyClass}`}
                    style={{ color: colors.accent }}
                  >
                    {event.date}
                  </p>
                  <h3
                    className={`mt-1 text-lg font-semibold ${fontPair.headingClass}`}
                    style={{ color: colors.primary }}
                  >
                    {event.title}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${fontPair.bodyClass}`}
                    style={{ color: `${colors.primary}CC` }}
                  >
                    {event.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
