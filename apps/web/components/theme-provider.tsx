'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ThemeColors } from '@planfortwo/types'
import { useWedding } from '@/hooks/use-wedding'

interface ThemeContextValue {
  themeColors: ThemeColors | null
  setThemeColors: (colors: ThemeColors | null) => void
  isDark: boolean
  toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  themeColors: null,
  setThemeColors: () => {},
  isDark: false,
  toggleDark: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return [0, 0, Math.round(l * 100)]
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6
  } else {
    h = ((r - g) / d + 4) / 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// Generate HSL shade values from a primary hex color
// Returns HSL channel strings like "16 48% 52%" for each shade level
function generatePaletteHsl(hex: string): Record<string, string> {
  const [h, s, l] = hexToHsl(hex)
  // Shade definitions: [shade, saturation, lightness]
  // Keeps the hue constant, varies saturation and lightness to create a natural palette
  const shades: [string, number, number][] = [
    ['50', Math.max(Math.round(s * 0.45), 10), 97],
    ['100', Math.max(Math.round(s * 0.55), 12), 94],
    ['200', Math.max(Math.round(s * 0.6), 15), 88],
    ['300', Math.max(Math.round(s * 0.65), 18), 78],
    ['400', Math.max(Math.round(s * 0.7), 20), 67],
    ['500', Math.max(Math.round(s * 0.85), 25), 58],
    ['600', s, l], // The original primary color
    ['700', Math.max(Math.round(s * 0.94), 20), Math.max(l - 8, 20)],
    ['800', Math.max(Math.round(s * 0.88), 18), Math.max(l - 15, 15)],
    ['900', Math.max(Math.round(s * 0.81), 15), Math.max(l - 21, 12)],
    ['950', Math.max(Math.round(s * 0.88), 10), Math.max(l - 36, 8)],
  ]

  const palette: Record<string, string> = {}
  for (const [shade, sat, light] of shades) {
    palette[shade] = `${h} ${sat}% ${light}%`
  }
  return palette
}

function applyThemeToDocument(colors: ThemeColors | null) {
  const root = document.documentElement

  if (colors) {
    // Primary color — shadcn CSS variables
    const [ph, ps, pl] = hexToHsl(colors.primary)
    const primaryHsl = `${ph} ${ps}% ${pl}%`
    root.style.setProperty('--primary', primaryHsl)
    root.style.setProperty('--primary-foreground', '0 0% 100%')
    root.style.setProperty('--ring', primaryHsl)
    root.style.setProperty('--chart-1', primaryHsl)

    // Generate wedding palette shades from primary (HSL channel format)
    const palette = generatePaletteHsl(colors.primary)
    for (const [shade, hslChannels] of Object.entries(palette)) {
      root.style.setProperty(`--w-${shade}`, hslChannels)
    }

    // Accent color — foreground/text CSS variables
    const [ah, as, al] = hexToHsl(colors.accent)
    const accentHsl = `${ah} ${as}% ${al}%`
    root.style.setProperty('--foreground', accentHsl)
    root.style.setProperty('--card-foreground', accentHsl)
    root.style.setProperty('--popover-foreground', accentHsl)
  } else {
    // Reset all to defaults
    const shadcnVars = [
      '--primary',
      '--primary-foreground',
      '--ring',
      '--chart-1',
      '--foreground',
      '--card-foreground',
      '--popover-foreground',
    ]
    for (const v of shadcnVars) {
      root.style.removeProperty(v)
    }

    // Reset wedding palette
    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
    for (const shade of shades) {
      root.style.removeProperty(`--w-${shade}`)
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data, loading: weddingLoading } = useWedding()
  const [themeColors, setThemeColorsState] = useState<ThemeColors | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const setThemeColors = useCallback((colors: ThemeColors | null) => {
    setThemeColorsState(colors)
    applyThemeToDocument(colors)
  }, [])

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      try {
        localStorage.setItem('planfortwo-dark', next ? '1' : '0')
      } catch {}
      return next
    })
  }, [])

  // Restore dark mode preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('planfortwo-dark')
      if (saved === '1') {
        setIsDark(true)
        document.documentElement.classList.add('dark')
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (weddingLoading) return

    setThemeColorsState(data?.wedding.themeColors ?? null)
    setLoaded(true)
  }, [data?.wedding.themeColors, weddingLoading])

  useEffect(() => {
    if (!loaded) return

    applyThemeToDocument(themeColors)
  }, [themeColors, loaded])

  // Apply theme when state changes
  return (
    <ThemeContext.Provider value={{ themeColors, setThemeColors, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
