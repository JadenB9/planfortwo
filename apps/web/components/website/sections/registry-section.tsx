'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { RegistryContent } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

interface RegistrySectionProps {
  title: string
  content: RegistryContent
}

function CashFundCard({
  registry,
  index,
  colors,
}: {
  registry: RegistryContent['registries'][number]
  index: number
  colors: { primary: string; accent: string }
}) {
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()
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
      className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <h3
        className={`mb-2 text-lg font-semibold ${headingClass}`}
        style={{ ...headingFont, color: colors.primary }}
      >
        {registry.name}
      </h3>
      {registry.description && (
        <p
          className={`mb-3 text-sm ${bodyClass}`}
          style={{ ...bodyFont, color: `${colors.primary}99` }}
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
            className={`mt-1 text-xs ${bodyClass}`}
            style={{ ...bodyFont, color: `${colors.primary}88` }}
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
      <a href={registry.url} target="_blank" rel="noopener noreferrer" className="text-center">
        {card}
      </a>
    )
  }

  return card
}

export function RegistrySection({ title, content }: RegistrySectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  const registries = content.registries ?? []
  const regularRegistries = registries.filter((r) => !r.isCashFund)
  const cashFunds = registries.filter((r) => r.isCashFund)

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.sectionBackground }}>
      <div className="mx-auto max-w-3xl px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-4 text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.message && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`mb-10 ${bodyClass}`}
            style={{ ...bodyFont, color: `${colors.primary}BB` }}
          >
            {content.message}
          </motion.p>
        )}

        {/* Regular registries */}
        {regularRegistries.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {regularRegistries.map((registry, i) => {
              const hasUrl = /^https?:\/\//i.test(registry.url)
              return (
                <motion.a
                  key={i}
                  href={hasUrl ? registry.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="w-full max-w-sm cursor-pointer rounded-2xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  {registry.logoUrl && /^https?:\/\//i.test(registry.logoUrl) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={registry.logoUrl}
                      alt={registry.name}
                      className="mx-auto mb-2 h-8 w-8 object-contain"
                    />
                  )}
                  <h3
                    className={`mb-3 text-lg font-semibold ${headingClass}`}
                    style={{ ...headingFont, color: colors.primary }}
                  >
                    {registry.name}
                  </h3>
                  <span
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: colors.accent }}
                  >
                    Visit Registry
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </motion.a>
              )
            })}
          </div>
        )}

        {/* Cash funds */}
        {cashFunds.length > 0 && (
          <div
            className={`flex flex-wrap justify-center gap-6 ${regularRegistries.length > 0 ? 'mt-8' : ''}`}
          >
            {cashFunds.map((fund, i) => (
              <CashFundCard key={i} registry={fund} index={i} colors={colors} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
