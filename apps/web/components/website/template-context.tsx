'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { CustomColors } from '@planfortwo/types'
import { getTemplate } from '@/lib/templates'
import { getFontPair, type FontPairConfig } from '@/lib/fonts'

interface TemplateStyles {
  colors: CustomColors
  fontPair: FontPairConfig
  templateId: string
  cssVariables: Record<string, string>
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
    const colors = customColors ?? template.defaultColors
    const fontPair = getFontPair(fontPairId)

    const cssVariables: Record<string, string> = {
      '--template-primary': colors.primary,
      '--template-secondary': colors.secondary,
      '--template-accent': colors.accent,
      '--template-background': colors.background,
    }

    return { colors, fontPair, templateId, cssVariables }
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
