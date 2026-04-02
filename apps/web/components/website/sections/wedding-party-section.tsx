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

function detectSide(role: string): 'groom' | 'bride' {
  return /bridesmaid|maid\s*of\s*honor|matron|flower\s*girl|bride/i.test(role) ? 'bride' : 'groom'
}

interface WeddingPartySectionProps {
  title: string
  content: WeddingPartyContent
}

function MemberCard({
  member,
  index,
  colors,
  headingClass,
  bodyClass,
  headingFont,
  bodyFont,
}: {
  member: WeddingPartyContent['members'][number]
  index: number
  colors: { primary: string; secondary: string; accent: string; background: string }
  headingClass: string
  bodyClass: string
  headingFont: React.CSSProperties
  bodyFont: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
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
  )
}

export function WeddingPartySection({ title, content }: WeddingPartySectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  const hasSides = content.members.some((m) => m.side)
  const groomMembers = hasSides
    ? content.members.filter((m) => (m.side ?? detectSide(m.role)) === 'groom')
    : []
  const brideMembers = hasSides
    ? content.members.filter((m) => (m.side ?? detectSide(m.role)) === 'bride')
    : []

  const shared = { colors, headingClass, bodyClass, headingFont, bodyFont }

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

        {hasSides ? (
          <>
            {/* Groom's side */}
            {groomMembers.length > 0 && (
              <div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`mb-6 text-center text-xl ${headingClass}`}
                  style={{ ...headingFont, color: colors.accent }}
                >
                  Groomsmen
                </motion.h3>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                  {groomMembers.map((member, i) => (
                    <MemberCard key={i} member={member} index={i} {...shared} />
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {groomMembers.length > 0 && brideMembers.length > 0 && (
              <div className="my-10 flex items-center gap-4 sm:my-14">
                <div className="flex-1 border-t" style={{ borderColor: `${colors.accent}40` }} />
                <span className="select-none text-lg" style={{ color: `${colors.accent}60` }}>
                  &amp;
                </span>
                <div className="flex-1 border-t" style={{ borderColor: `${colors.accent}40` }} />
              </div>
            )}

            {/* Bride's side */}
            {brideMembers.length > 0 && (
              <div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`mb-6 text-center text-xl ${headingClass}`}
                  style={{ ...headingFont, color: colors.accent }}
                >
                  Bridesmaids
                </motion.h3>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                  {brideMembers.map((member, i) => (
                    <MemberCard key={i} member={member} index={i} {...shared} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Backward-compatible: no side data, show flat grid */
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {content.members.map((member, i) => (
              <MemberCard key={i} member={member} index={i} {...shared} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
