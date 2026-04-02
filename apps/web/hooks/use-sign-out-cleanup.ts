'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'

/**
 * Watches Clerk auth state and clears user-specific localStorage + theme
 * when the user signs out. This prevents the next visitor from seeing
 * stale dark mode, custom colors, or sidebar order from the previous user.
 */

const USER_STORAGE_KEYS = ['planfortwo-dark', 'sidebar-nav-order'] as const

function resetThemeFromDocument(): void {
  const root = document.documentElement

  // Remove dark mode class
  root.classList.remove('dark')

  // Remove custom theme CSS variables
  const themeVars = [
    '--primary',
    '--primary-foreground',
    '--ring',
    '--chart-1',
    '--foreground',
    '--card-foreground',
    '--popover-foreground',
  ]
  for (const v of themeVars) {
    root.style.removeProperty(v)
  }

  // Remove wedding palette shades
  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  for (const shade of shades) {
    root.style.removeProperty(`--w-${shade}`)
  }
}

export function useSignOutCleanup(): void {
  const { isSignedIn } = useAuth()
  const wasSignedIn = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    // Skip the first render where isSignedIn is still loading (undefined)
    if (isSignedIn === undefined) return

    // Detect transition from signed-in to signed-out
    if (wasSignedIn.current === true && isSignedIn === false) {
      // Clear user-specific localStorage keys
      for (const key of USER_STORAGE_KEYS) {
        try {
          localStorage.removeItem(key)
        } catch {
          // localStorage may be unavailable
        }
      }

      // Reset theme to defaults
      resetThemeFromDocument()
    }

    wasSignedIn.current = isSignedIn
  }, [isSignedIn])
}
