'use client'

import { useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface AnalyticsTrackerProps {
  slug: string
}

export function AnalyticsTracker({ slug }: AnalyticsTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {})

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionType = entry.target.getAttribute('data-section-type')
            if (sectionType) {
              fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path: window.location.pathname,
                  sectionViewed: sectionType,
                }),
              }).catch(() => {})
              observer.unobserve(entry.target)
            }
          }
        }
      },
      { threshold: 0.3 },
    )

    const sections = document.querySelectorAll('[data-section-type]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [slug])

  return null
}
