'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function useTabParam<T extends string>(
  key: string,
  defaultValue: T,
  validValues?: T[],
): [T, (value: T) => void] {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const raw = searchParams.get(key) as T | null
  const value =
    raw !== null && (validValues === undefined || validValues.includes(raw)) ? raw : defaultValue

  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue === defaultValue) {
        params.delete(key)
      } else {
        params.set(key, newValue)
      }
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [searchParams, router, pathname, key, defaultValue],
  )

  return [value, setValue]
}
