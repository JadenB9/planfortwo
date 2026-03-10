'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Cleans up stale scroll locks left behind by Radix Dialog (react-remove-scroll)
 * when navigating between pages via Next.js App Router.
 */
export function ScrollLockGuard() {
  const pathname = usePathname()

  useEffect(() => {
    // On route change, remove any leftover scroll-lock styles from body
    const body = document.body
    if (body.hasAttribute('data-scroll-locked')) {
      body.removeAttribute('data-scroll-locked')
      body.style.overflow = ''
      body.style.paddingRight = ''
    }
  }, [pathname])

  return null
}
