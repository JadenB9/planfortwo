'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { MapSectionContent, PublicEventMap } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'

interface MapSectionProps {
  title: string
  content: MapSectionContent
  eventMaps: PublicEventMap[]
}

export function MapSection({ title, content, eventMaps }: MapSectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()

  // Filter event maps if user picked specific ones, otherwise show all with maps
  const selectedIds = content.selectedEventIds
  const visibleMaps =
    selectedIds && selectedIds.length > 0
      ? eventMaps.filter((m) => selectedIds.includes(m.id))
      : eventMaps

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.sectionBackground }}>
      <div className="mx-auto max-w-5xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-4 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>

        {content.message && (
          <p
            className={`mx-auto mb-12 max-w-2xl text-center text-base ${bodyClass}`}
            style={{ ...bodyFont, color: `${colors.primary}BB` }}
          >
            {content.message}
          </p>
        )}

        {visibleMaps.length === 0 ? (
          <div
            className="border-border bg-background mx-auto max-w-xl rounded-2xl border border-dashed p-10 text-center"
            style={{ borderColor: `${colors.primary}33` }}
          >
            <MapPin
              className="mx-auto mb-3 h-8 w-8"
              style={{ color: `${colors.primary}88` }}
              aria-hidden
            />
            <p className={`text-sm ${bodyClass}`} style={{ ...bodyFont, color: colors.primary }}>
              Maps are on the way. Check back soon!
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-8 ${visibleMaps.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'}`}
          >
            {visibleMaps.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background overflow-hidden rounded-2xl shadow-sm"
              >
                {/* Auto-height container so the couple's crop frame dictates
                    the aspect ratio — no forced 4:3 crop-out. */}
                <div className="relative w-full bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.mapImageUrl}
                    alt={`Map for ${m.name}`}
                    className="block h-auto w-full"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3
                    className={`text-lg font-semibold ${headingClass}`}
                    style={{ ...headingFont, color: colors.primary }}
                  >
                    {m.name}
                  </h3>
                  {content.showAddresses && m.address && (
                    <div
                      className={`mt-2 flex items-start gap-2 text-sm ${bodyClass}`}
                      style={{ ...bodyFont, color: `${colors.primary}BB` }}
                    >
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: colors.accent }}
                      />
                      <span>{m.address}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
