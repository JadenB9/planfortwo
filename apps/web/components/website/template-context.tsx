'use client'

import { createContext, useContext, useMemo, type ReactNode, type CSSProperties } from 'react'
import type { CustomColors, TextSize } from '@planfortwo/types'
import { getTemplate } from '@/lib/templates'
import { getFontPair, type FontPairConfig } from '@/lib/fonts'

interface ResolvedColors extends CustomColors {
  sectionBackground: string
}

interface TypographyOptions {
  headingBold: boolean
  headingItalic: boolean
  bodyBold: boolean
  bodyItalic: boolean
  headingSize: TextSize
  bodySize: TextSize
}

interface TemplateStyles {
  colors: ResolvedColors
  fontPair: FontPairConfig
  templateId: string
  cssVariables: Record<string, string>
  typography: TypographyOptions
}

const TemplateContext = createContext<TemplateStyles | null>(null)

interface TemplateProviderProps {
  templateId: string
  customColors: CustomColors | null
  fontPairId: string
  children: ReactNode
}

export function TemplateProvider({
  templateId,
  customColors,
  fontPairId,
  children,
}: TemplateProviderProps) {
  const styles = useMemo(() => {
    const template = getTemplate(templateId)
    const baseColors = customColors ?? template.defaultColors
    const sectionBackground = baseColors.sectionBackground || `${baseColors.secondary}33`

    const colors: ResolvedColors = {
      ...baseColors,
      sectionBackground,
    }

    const fontPair = getFontPair(fontPairId)

    const cssVariables: Record<string, string> = {
      '--template-primary': colors.primary,
      '--template-secondary': colors.secondary,
      '--template-accent': colors.accent,
      '--template-background': colors.background,
      '--template-section-background': colors.sectionBackground,
    }

    const typography: TypographyOptions = {
      headingBold: baseColors.headingBold ?? true,
      headingItalic: baseColors.headingItalic ?? false,
      bodyBold: baseColors.bodyBold ?? false,
      bodyItalic: baseColors.bodyItalic ?? false,
      headingSize: baseColors.headingSize ?? 'md',
      bodySize: baseColors.bodySize ?? 'md',
    }

    return { colors, fontPair, templateId, cssVariables, typography }
  }, [templateId, customColors, fontPairId])

  return (
    <TemplateContext.Provider value={styles}>
      <div style={styles.cssVariables as React.CSSProperties}>{children}</div>
    </TemplateContext.Provider>
  )
}

export function useTemplateStyles(): TemplateStyles {
  const ctx = useContext(TemplateContext)
  if (!ctx) throw new Error('useTemplateStyles must be used within TemplateProvider')
  return ctx
}

/** Determine the generic fallback family based on font pair class */
function fallbackFamily(cls: string): string {
  return cls.includes('font-sans') ? 'sans-serif' : 'serif'
}

/** Build a className string for headings that respects typography options */
export function useHeadingClass(): string {
  const { fontPair, typography } = useTemplateStyles()
  // Keep non-font-family classes (italic, tracking-wide, etc.)
  const extras = fontPair.headingClass
    .split(' ')
    .filter((c) => c !== 'font-serif' && c !== 'font-sans')
  const parts = [...extras]
  if (typography.headingBold) parts.push('font-bold')
  if (typography.headingItalic) parts.push('italic')
  return parts.join(' ')
}

/** Build a className string for body text that respects typography options */
export function useBodyClass(): string {
  const { fontPair, typography } = useTemplateStyles()
  const extras = fontPair.bodyClass
    .split(' ')
    .filter((c) => c !== 'font-serif' && c !== 'font-sans')
  const parts = [...extras]
  if (typography.bodyBold) parts.push('font-bold')
  if (typography.bodyItalic) parts.push('italic')
  return parts.join(' ')
}

/** Zoom multiplier for text size options */
function sizeZoom(size: TextSize): number | undefined {
  if (size === 'sm') return 0.85
  if (size === 'lg') return 1.2
  return undefined
}

/** Get inline fontFamily style for headings */
export function useHeadingFont(): CSSProperties {
  const { fontPair, typography } = useTemplateStyles()
  const style: CSSProperties = {
    fontFamily: `'${fontPair.heading}', ${fallbackFamily(fontPair.headingClass)}`,
  }
  const z = sizeZoom(typography.headingSize)
  if (z) style.zoom = z
  return style
}

/** Get inline fontFamily style for body text */
export function useBodyFont(): CSSProperties {
  const { fontPair, typography } = useTemplateStyles()
  const style: CSSProperties = {
    fontFamily: `'${fontPair.body}', ${fallbackFamily(fontPair.bodyClass)}`,
  }
  const z = sizeZoom(typography.bodySize)
  if (z) style.zoom = z
  return style
}
