'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Palette, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import type { CustomColors } from '@planfortwo/types'
import { templates, getTemplate } from '@/lib/templates'
import { fontPairs } from '@/lib/fonts'
import { TemplatePreview } from '../template-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TemplateSelectorProps {
  selectedId: string
  onSelect: (templateId: string) => void
  customColors: CustomColors | null
  fontPair: string
  onCustomize: (updates: { customColors?: CustomColors; fontPair?: string }) => void
}

const COLOR_FIELDS: { key: keyof CustomColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
]

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/

export function TemplateSelector({
  selectedId,
  onSelect,
  customColors,
  fontPair,
  onCustomize,
}: TemplateSelectorProps) {
  const isCustomTemplate = selectedId === 'custom'
  const [showCustomizer, setShowCustomizer] = useState(isCustomTemplate || !!customColors)

  // Keep a local copy of colors for debouncing
  const template = getTemplate(selectedId)
  const activeColors = customColors ?? template.defaultColors
  const [localColors, setLocalColors] = useState<CustomColors>(activeColors)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local colors when customColors or selectedId changes externally
  useEffect(() => {
    const t = getTemplate(selectedId)
    setLocalColors(customColors ?? t.defaultColors)
  }, [customColors, selectedId])

  // Auto-expand customizer when custom template is selected
  useEffect(() => {
    if (isCustomTemplate) {
      setShowCustomizer(true)
    }
  }, [isCustomTemplate])

  const debouncedUpdate = useCallback(
    (colors: CustomColors) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onCustomize({ customColors: colors })
      }, 500)
    },
    [onCustomize],
  )

  const handleColorChange = useCallback(
    (key: keyof CustomColors, value: string) => {
      const updated = { ...localColors, [key]: value }
      setLocalColors(updated)
      debouncedUpdate(updated)
    },
    [localColors, debouncedUpdate],
  )

  const handleHexInput = useCallback(
    (key: keyof CustomColors, value: string) => {
      // Allow typing without immediate validation
      const updated = { ...localColors, [key]: value }
      setLocalColors(updated)

      // Only push to API if valid hex
      if (HEX_REGEX.test(value)) {
        debouncedUpdate(updated)
      }
    },
    [localColors, debouncedUpdate],
  )

  const handleFontChange = useCallback(
    (fontPairId: string) => {
      onCustomize({ fontPair: fontPairId })
    },
    [onCustomize],
  )

  const handleReset = useCallback(() => {
    const t = getTemplate(selectedId)
    setLocalColors(t.defaultColors)
    onCustomize({ customColors: t.defaultColors, fontPair: t.fontPair })
  }, [selectedId, onCustomize])

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      onSelect(templateId)
      // When switching templates, reset custom colors so template defaults apply
      if (!customColors) {
        // No custom colors were set, just switch
        return
      }
      // Clear custom colors so the new template defaults take effect
      const t = getTemplate(templateId)
      setLocalColors(t.defaultColors)
      onCustomize({ customColors: t.defaultColors, fontPair: t.fontPair })
    },
    [onSelect, customColors, onCustomize],
  )

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose a Template</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <TemplatePreview
            key={t.id}
            templateId={t.id}
            selected={t.id === selectedId}
            onClick={() => handleTemplateSelect(t.id)}
          />
        ))}
      </div>

      {/* Customize Colors toggle (non-custom templates) */}
      {!isCustomTemplate && (
        <button
          type="button"
          onClick={() => setShowCustomizer((v) => !v)}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <Palette className="h-4 w-4" />
          Customize Colors & Font
          {showCustomizer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}

      {/* Color customization panel */}
      {showCustomizer && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Customize Colors</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Label htmlFor={`color-${key}`} className="w-24 shrink-0 text-sm text-gray-700">
                  {label}
                </Label>
                <div className="relative">
                  <input
                    type="color"
                    id={`color-picker-${key}`}
                    value={HEX_REGEX.test(localColors[key]) ? localColors[key] : '#000000'}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5"
                  />
                </div>
                <Input
                  id={`color-${key}`}
                  value={localColors[key]}
                  onChange={(e) => handleHexInput(key, e.target.value)}
                  placeholder="#000000"
                  className="h-9 w-28 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="font-pair" className="w-24 shrink-0 text-sm text-gray-700">
                Font Style
              </Label>
              <Select value={fontPair} onValueChange={handleFontChange}>
                <SelectTrigger id="font-pair" className="w-64">
                  <SelectValue placeholder="Select a font pair" />
                </SelectTrigger>
                <SelectContent>
                  {fontPairs.map((fp) => (
                    <SelectItem key={fp.id} value={fp.id}>
                      {fp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              {isCustomTemplate
                ? 'Pick any combination to make this template yours.'
                : 'Custom colors override the template defaults.'}
            </p>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
