'use client'

import { motion } from 'framer-motion'
import type { HeroContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface HeroSectionProps {
  content: HeroContent
  weddingName: string
  weddingDate: Date | null
}

function formatWeddingDate(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function getCountdown(date: Date | null): { days: number; hours: number } | null {
  if (!date) return null
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
  }
}

/** Only allow http(s) URLs and block characters that could escape CSS url() context */
function safeImageUrl(url: string | undefined | null): string | null {
  if (!url) return null
  if (!/^https?:\/\//i.test(url)) return null
  if (/[()'"\\]/.test(url)) return null
  return url
}

export function HeroSection({ content, weddingName, weddingDate }: HeroSectionProps) {
  const { colors, fontPair } = useTemplateStyles()
  const countdown = content.showCountdown ? getCountdown(weddingDate) : null
  const bgUrl = safeImageUrl(content.backgroundImageUrl)

  return (
    <section
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {bgUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      <div className="relative z-10 px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl ${fontPair.headingClass}`}
          style={{ color: bgUrl ? '#FFFFFF' : colors.primary }}
        >
          {content.headline || weddingName}
        </motion.h1>
        {content.subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`mt-4 text-lg sm:text-xl md:text-2xl ${fontPair.bodyClass}`}
            style={{ color: bgUrl ? '#FFFFFFCC' : colors.accent }}
          >
            {content.subheadline}
          </motion.p>
        )}
        {content.showDate && weddingDate && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`mt-6 text-base sm:text-lg ${fontPair.bodyClass}`}
            style={{ color: bgUrl ? '#FFFFFFBB' : colors.primary }}
          >
            {formatWeddingDate(weddingDate)}
          </motion.p>
        )}
        {countdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex justify-center gap-6"
          >
            <div className="text-center">
              <span
                className={`block text-3xl font-bold sm:text-4xl ${fontPair.headingClass}`}
                style={{ color: bgUrl ? '#FFFFFF' : colors.primary }}
              >
                {countdown.days}
              </span>
              <span
                className={`text-sm ${fontPair.bodyClass}`}
                style={{ color: bgUrl ? '#FFFFFFAA' : colors.accent }}
              >
                days
              </span>
            </div>
            <div className="text-center">
              <span
                className={`block text-3xl font-bold sm:text-4xl ${fontPair.headingClass}`}
                style={{ color: bgUrl ? '#FFFFFF' : colors.primary }}
              >
                {countdown.hours}
              </span>
              <span
                className={`text-sm ${fontPair.bodyClass}`}
                style={{ color: bgUrl ? '#FFFFFFAA' : colors.accent }}
              >
                hours
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
