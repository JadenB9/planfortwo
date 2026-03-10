'use client'

import { motion } from 'framer-motion'
import type { FaqContent } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

interface FaqSectionProps {
  title: string
  content: FaqContent
}

export function FaqSection({ title, content }: FaqSectionProps) {
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
          className={`mb-12 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        <div className="space-y-4">
          {content.questions.map((q, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl bg-white p-6 shadow-sm"
            >
              <summary
                className={`cursor-pointer list-none font-semibold ${headingClass}`}
                style={{ ...headingFont, color: colors.primary }}
              >
                {q.question}
              </summary>
              <p
                className={`mt-3 text-sm leading-relaxed ${bodyClass}`}
                style={{ ...bodyFont, color: `${colors.primary}BB` }}
              >
                {q.answer}
              </p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}
