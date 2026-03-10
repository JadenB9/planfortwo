'use client'

import { motion } from 'framer-motion'
import type { WeddingPartyContent } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

/** Only allow http(s) image URLs */
function safeImgSrc(url: string | undefined | null): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return null
}

interface WeddingPartySectionProps {
  title: string
  content: WeddingPartyContent
}

export function WeddingPartySection({ title, content }: WeddingPartySectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-5xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {content.members.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-0 text-center"
            >
              {safeImgSrc(member.imageUrl) ? (
                <div className="mx-auto aspect-square w-full max-w-[10rem] overflow-hidden rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeImgSrc(member.imageUrl)!}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="mx-auto flex aspect-square w-full max-w-[10rem] items-center justify-center rounded-full text-3xl font-bold"
                  style={{ backgroundColor: colors.secondary, color: colors.primary }}
                >
                  {member.name.charAt(0)}
                </div>
              )}
              <h3
                className={`mt-4 text-lg font-semibold ${headingClass}`}
                style={{ ...headingFont, color: colors.primary }}
              >
                {member.name}
              </h3>
              <p className={`text-sm ${bodyClass}`} style={{ ...bodyFont, color: colors.accent }}>
                {member.role}
              </p>
              {member.description && (
                <p
                  className={`mt-2 text-sm ${bodyClass}`}
                  style={{ ...bodyFont, color: `${colors.primary}99` }}
                >
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
