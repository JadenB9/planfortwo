'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import type { RegistryContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface RegistrySectionProps {
  title: string
  content: RegistryContent
}

export function RegistrySection({ title, content }: RegistrySectionProps) {
  const { colors, fontPair } = useTemplateStyles()

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
        <div className="flex flex-wrap justify-center gap-6">
          {content.registries.map((registry, i) => (
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
      </div>
    </section>
  )
}
