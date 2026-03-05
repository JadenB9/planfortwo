'use client'

import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import type { CustomSectionContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface CustomSectionProps {
  title: string
  content: CustomSectionContent
}

export function CustomSection({ title, content }: CustomSectionProps) {
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
            className={`prose mx-auto max-w-none ${fontPair.bodyClass}`}
            style={{ color: colors.primary }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        )}
      </div>
    </section>
  )
}
