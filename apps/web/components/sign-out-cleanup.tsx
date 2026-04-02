'use client'

import { useSignOutCleanup } from '@/hooks/use-sign-out-cleanup'

/**
 * Thin client wrapper that mounts the sign-out cleanup hook.
 * Place inside ClerkProvider so it can observe auth state changes.
 * When the user signs out, it clears all user-specific localStorage
 * and resets custom theme colors / dark mode on the document.
 */
export function SignOutCleanup() {
  useSignOutCleanup()
  return null
}
