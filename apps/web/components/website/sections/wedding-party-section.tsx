'use client'

import { motion } from 'framer-motion'
import type { WeddingPartyContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface WeddingPartySectionProps {
  title: string
  content: WeddingPartyContent
}

export function WeddingPartySection({ title, content }: WeddingPartySectionProps) {
  const { colors, fontPair } = useTemplateStyles()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-5xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {content.members.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              {member.imageUrl ? (
                <div className="mx-auto h-40 w-40 overflow-hidden rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.imageUrl} alt={member.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div
                  className="mx-auto flex h-40 w-40 items-center justify-center rounded-full text-3xl font-bold"
                  style={{ backgroundColor: colors.secondary, color: colors.primary }}
                >
                  {member.name.charAt(0)}
                </div>
              )}
              <h3 className={`mt-4 text-lg font-semibold ${fontPair.headingClass}`} style={{ color: colors.primary }}>
                {member.name}
              </h3>
              <p className={`text-sm ${fontPair.bodyClass}`} style={{ color: colors.accent }}>
                {member.role}
              </p>
              {member.description && (
                <p className={`mt-2 text-sm ${fontPair.bodyClass}`} style={{ color: `${colors.primary}99` }}>
                  {member.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
