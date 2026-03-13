'use client'

import { motion } from 'framer-motion'
import type { OurStoryContent } from '@planfortwo/types'
import { sanitizeHtml } from '@/lib/sanitize'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

interface OurStorySectionProps {
  title: string
  content: OurStoryContent
}

export function OurStorySection({ title, content }: OurStorySectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-3xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-8 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.body && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`prose mx-auto max-w-none text-center ${bodyClass}`}
            style={{ ...bodyFont, color: colors.primary }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(content.body, {
                ALLOWED_TAGS: [
                  'p',
                  'br',
                  'strong',
                  'em',
                  'u',
                  'a',
                  'ul',
                  'ol',
                  'li',
                  'h1',
                  'h2',
                  'h3',
                  'h4',
                  'h5',
                  'h6',
                  'blockquote',
                  'span',
                  'div',
                  'img',
                ],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
                ALLOW_DATA_ATTR: false,
              }),
            }}
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
                    className={`text-sm font-medium ${bodyClass}`}
                    style={{ ...bodyFont, color: colors.accent }}
                  >
                    {event.date}
                  </p>
                  <h3
                    className={`mt-1 text-lg font-semibold ${headingClass}`}
                    style={{ ...headingFont, color: colors.primary }}
                  >
                    {event.title}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${bodyClass}`}
                    style={{ ...bodyFont, color: `${colors.primary}CC` }}
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
