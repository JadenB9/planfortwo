'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { CustomColors } from '@planfortwo/types'
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

/** Build a className string for headings that respects typography options */
export function useHeadingClass(): string {
  const { fontPair, typography } = useTemplateStyles()
  const parts = [fontPair.headingClass]
  if (typography.headingBold) parts.push('font-bold')
  if (typography.headingItalic) parts.push('italic')
  return parts.join(' ')
}

/** Build a className string for body text that respects typography options */
export function useBodyClass(): string {
  const { fontPair, typography } = useTemplateStyles()
  const parts = [fontPair.bodyClass]
  if (typography.bodyBold) parts.push('font-bold')
  if (typography.bodyItalic) parts.push('italic')
  return parts.join(' ')
}
