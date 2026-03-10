'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GuestbookSectionContent, GuestbookEntry } from '@planfortwo/types'
import { useTemplateStyles, useHeadingClass, useBodyClass } from '../template-context'

interface GuestbookSectionProps {
  title: string
  content: GuestbookSectionContent
  entries: GuestbookEntry[]
  slug: string
  onSubmit?: (authorName: string, message: string, honeypot?: string) => Promise<void>
}

export function GuestbookSection({ title, content, entries, onSubmit }: GuestbookSectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim() || !onSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim(), message.trim(), honeypot || undefined)
      setName('')
      setMessage('')
      setHoneypot('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  const visibleEntries = entries.filter((e) => e.isVisible)

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.sectionBackground }}>
      <div className="mx-auto max-w-3xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-4 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.message && (
          <p className={`mb-8 text-center ${bodyClass}`} style={{ color: `${colors.primary}BB` }}>
            {content.message}
          </p>
        )}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className={`w-full rounded-lg border px-4 py-2 text-sm ${bodyClass}`}
              style={{ borderColor: colors.secondary, color: colors.primary }}
            />
          </div>
          <div className="mb-4">
            <textarea
              placeholder="Leave a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={3}
              required
              className={`w-full resize-none rounded-lg border px-4 py-2 text-sm ${bodyClass}`}
              style={{ borderColor: colors.secondary, color: colors.primary }}
            />
          </div>
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !message.trim()}
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
          >
            {submitting ? 'Signing...' : 'Sign Guestbook'}
          </button>
          {submitted && (
            <p className={`mt-2 text-sm ${bodyClass}`} style={{ color: colors.accent }}>
              {content.requireApproval
                ? 'Thank you! Your message will appear after approval.'
                : 'Thank you for your message!'}
            </p>
          )}
        </motion.form>
        {visibleEntries.length > 0 && (
          <div className="space-y-4">
            {visibleEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <p className={`text-sm ${bodyClass}`} style={{ color: colors.primary }}>
                  {entry.message}
                </p>
                <p
                  className={`mt-2 text-xs font-medium ${bodyClass}`}
                  style={{ color: colors.accent }}
                >
                  — {entry.authorName}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
