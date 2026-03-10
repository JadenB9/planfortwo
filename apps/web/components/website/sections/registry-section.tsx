'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Heart } from 'lucide-react'
import type { RegistryContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface RegistrySectionProps {
  title: string
  content: RegistryContent
}

function CashFundCard({
  registry,
  index,
  colors,
  fontPair,
}: {
  registry: RegistryContent['registries'][number]
  index: number
  colors: { primary: string; accent: string }
  fontPair: { headingClass: string; bodyClass: string }
}) {
  const hasUrl = /^https?:\/\//i.test(registry.url)
  const progress =
    registry.goalAmount && registry.goalAmount > 0
      ? Math.min(100, Math.round(((registry.currentAmount ?? 0) / registry.goalAmount) * 100))
      : null

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="w-full max-w-sm rounded-2xl bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-center gap-2">
        <Heart className="h-5 w-5" style={{ color: colors.accent }} />
        <h3
          className={`text-lg font-semibold ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {registry.name}
        </h3>
      </div>
      {registry.description && (
        <p
          className={`mb-3 text-sm ${fontPair.bodyClass}`}
          style={{ color: `${colors.primary}99` }}
        >
          {registry.description}
        </p>
      )}
      {progress !== null && (
        <div className="mb-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: colors.accent }}
            />
          </div>
          <p
            className={`mt-1 text-xs ${fontPair.bodyClass}`}
            style={{ color: `${colors.primary}88` }}
          >
            {progress}% funded
          </p>
        </div>
      )}
      {hasUrl && (
        <span
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: colors.accent }}
        >
          Contribute
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      )}
    </motion.div>
  )

  if (hasUrl) {
    return (
      <a href={registry.url} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    )
  }

  return card
}

export function RegistrySection({ title, content }: RegistrySectionProps) {
  const { colors, fontPair } = useTemplateStyles()

  const regularRegistries = content.registries.filter((r) => !r.isCashFund)
  const cashFunds = content.registries.filter((r) => r.isCashFund)

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.sectionBackground }}>
      <div className="mx-auto max-w-3xl px-4 text-center">
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
            className={`mb-10 ${fontPair.bodyClass}`}
            style={{ color: `${colors.primary}BB` }}
          >
            {content.message}
          </motion.p>
        )}

        {/* Regular registries */}
        {regularRegistries.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {regularRegistries.map((registry, i) => (
              <motion.a
                key={i}
                href={/^https?:\/\//i.test(registry.url) ? registry.url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {registry.logoUrl && /^https?:\/\//i.test(registry.logoUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={registry.logoUrl}
                    alt={registry.name}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <span
                  className={`font-medium ${fontPair.bodyClass}`}
                  style={{ color: colors.primary }}
                >
                  {registry.name}
                </span>
                <ExternalLink className="h-4 w-4" style={{ color: colors.accent }} />
              </motion.a>
            ))}
          </div>
        )}

        {/* Cash funds */}
        {cashFunds.length > 0 && (
          <div
            className={`flex flex-wrap justify-center gap-6 ${regularRegistries.length > 0 ? 'mt-8' : ''}`}
          >
            {cashFunds.map((fund, i) => (
              <CashFundCard key={i} registry={fund} index={i} colors={colors} fontPair={fontPair} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
