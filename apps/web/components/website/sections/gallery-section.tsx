'use client'

import { motion } from 'framer-motion'
import type { GalleryContent, WebsitePhoto } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'

interface GallerySectionProps {
  title: string
  content: GalleryContent
  photos: WebsitePhoto[]
}

export function GallerySection({ title, content, photos }: GallerySectionProps) {
  const { colors, fontPair } = useTemplateStyles()
  const columns = content.columns ?? 3

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.background }}>
      <div className="mx-auto max-w-6xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        {photos.length === 0 ? (
          <p className={`text-center ${fontPair.bodyClass}`} style={{ color: `${colors.primary}99` }}>
            No photos uploaded yet
          </p>
        ) : content.layout === 'masonry' ? (
          <div className={`columns-1 gap-4 sm:columns-2 lg:columns-${columns}`}>
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="mb-4 break-inside-avoid overflow-hidden rounded-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.altText ?? ''}
                  className="w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`,
            }}
          >
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square overflow-hidden rounded-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.altText ?? ''}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
