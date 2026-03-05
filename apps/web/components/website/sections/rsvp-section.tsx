'use client'

import { motion } from 'framer-motion'
import type { RsvpSectionContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface RsvpSectionProps {
  title: string
  content: RsvpSectionContent
  rsvpSlug: string | null
}

export function RsvpSection({ title, content, rsvpSlug }: RsvpSectionProps) {
  const { colors, fontPair } = useTemplateStyles()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: `${colors.secondary}33` }}>
      <div className="mx-auto max-w-2xl px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-4 text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.message && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`mb-8 ${fontPair.bodyClass}`}
            style={{ color: `${colors.primary}BB` }}
          >
            {content.message}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {rsvpSlug ? (
            <a
              href={`/rsvp/${rsvpSlug}`}
              className="inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              RSVP Now
            </a>
          ) : (
            <p className={`text-sm ${fontPair.bodyClass}`} style={{ color: `${colors.primary}99` }}>
              RSVP details will be available shortly
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
