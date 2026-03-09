'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Phone, MapPin } from 'lucide-react'
import type { TravelContent } from '@planfortwo/types'
import { sanitizeHtml } from '@/lib/sanitize'
import { useTemplateStyles } from '../template-context'

interface TravelSectionProps {
  title: string
  content: TravelContent
}

const safeHref = (url: string | undefined) => (url && /^https?:\/\//i.test(url) ? url : undefined)

export function TravelSection({ title, content }: TravelSectionProps) {
  const { colors, fontPair } = useTemplateStyles()

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: `${colors.secondary}33` }}>
      <div className="mx-auto max-w-4xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.directions && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`mb-10 text-center ${fontPair.bodyClass}`}
            style={{ color: `${colors.primary}CC` }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.directions) }}
          />
        )}
        {content.accommodations.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {content.accommodations.map((hotel, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <h3
                  className={`text-lg font-semibold ${fontPair.headingClass}`}
                  style={{ color: colors.primary }}
                >
                  {hotel.name}
                </h3>
                <div className={`mt-3 space-y-2 text-sm ${fontPair.bodyClass}`}>
                  {hotel.address && (
                    <div
                      className="flex items-start gap-2"
                      style={{ color: `${colors.primary}BB` }}
                    >
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: colors.accent }}
                      />
                      {hotel.address}
                    </div>
                  )}
                  {hotel.phone && (
                    <div
                      className="flex items-center gap-2"
                      style={{ color: `${colors.primary}BB` }}
                    >
                      <Phone className="h-4 w-4" style={{ color: colors.accent }} />
                      {hotel.phone}
                    </div>
                  )}
                  {hotel.bookingCode && (
                    <p style={{ color: colors.accent }}>
                      Booking code: <span className="font-medium">{hotel.bookingCode}</span>
                    </p>
                  )}
                  {hotel.notes && <p style={{ color: `${colors.primary}99` }}>{hotel.notes}</p>}
                  {safeHref(hotel.url) && (
                    <a
                      href={safeHref(hotel.url)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium"
                      style={{ color: colors.accent }}
                    >
                      Book Now <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {content.mapEmbed && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 overflow-hidden rounded-2xl"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(content.mapEmbed, {
                ADD_TAGS: ['iframe'],
                ADD_ATTR: ['allowfullscreen', 'frameborder', 'loading', 'src'],
                ALLOWED_URI_REGEXP: /^https:\/\/(www\.)?google\.com\/maps\//,
              }),
            }}
          />
        )}
      </div>
    </section>
  )
}
