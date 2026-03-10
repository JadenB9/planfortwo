'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Palette, RotateCcw, ChevronDown, ChevronUp, Save, Trash2, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomColors, SavedPalette, TextSize } from '@planfortwo/types'
import { templates, getTemplate } from '@/lib/templates'
import { fontPairs } from '@/lib/fonts'
import { TemplatePreview } from '../template-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
]

interface TemplateSelectorProps {
  selectedId: string
  onSelect: (templateId: string) => void
  customColors: CustomColors | null
  savedPalettes: SavedPalette[] | null
  fontPair: string
  onCustomize: (updates: {
    customColors?: CustomColors
    savedPalettes?: SavedPalette[] | null
    fontPair?: string
  }) => void
}

type ColorKey = 'primary' | 'secondary' | 'accent' | 'background' | 'sectionBackground'

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'sectionBackground', label: 'Section Tint' },
]

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/

function computeSectionBgDefault(secondary: string): string {
  // Composite secondary at 20% alpha on white to get the solid equivalent
  const hex = secondary.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const alpha = 0.2
  const cr = Math.round(r * alpha + 255 * (1 - alpha))
  const cg = Math.round(g * alpha + 255 * (1 - alpha))
  const cb = Math.round(b * alpha + 255 * (1 - alpha))
  return `#${cr.toString(16).padStart(2, '0')}${cg.toString(16).padStart(2, '0')}${cb.toString(16).padStart(2, '0')}`
}

function generatePaletteId(): string {
  return crypto.randomUUID()
}

// Build Google Fonts URL for all font pairs
const GOOGLE_FONTS_URL = (() => {
  const families = fontPairs
    .flatMap((fp) => [fp.heading, fp.body])
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((name) => `family=${name.replace(/\s+/g, '+')}:wght@400;700`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
})()

function FontPreviewPicker({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    // Inject Google Fonts stylesheet if not already present
    const linkId = 'font-preview-gfonts'
    if (document.getElementById(linkId)) {
      setFontsLoaded(true)
      return
    }
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    link.onload = () => setFontsLoaded(true)
    document.head.appendChild(link)
  }, [])

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {fontPairs.map((fp) => (
        <button
          key={fp.id}
          type="button"
          onClick={() => onSelect(fp.id)}
          className={`group relative rounded-lg border-2 p-3 text-left transition-all ${
            selected === fp.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          {selected === fp.id && (
            <div className="absolute right-2 top-2">
              <Check className="h-4 w-4 text-blue-500" />
            </div>
          )}
          <p
            className="text-lg leading-tight"
            style={{
              fontFamily: fontsLoaded ? `'${fp.heading}', serif` : undefined,
              opacity: fontsLoaded ? 1 : 0.6,
            }}
          >
            {fp.previewText}
          </p>
          <p
            className="mt-1 text-xs"
            style={{
              fontFamily: fontsLoaded ? `'${fp.body}', sans-serif` : undefined,
              color: '#666',
            }}
          >
            {fp.heading} + {fp.body}
          </p>
        </button>
      ))}
    </div>
  )
}

export function TemplateSelector({
  selectedId,
  onSelect,
  customColors,
  savedPalettes,
  fontPair,
  onCustomize,
}: TemplateSelectorProps) {
  const isCustomTemplate = selectedId === 'custom'
  const [showCustomizer, setShowCustomizer] = useState(isCustomTemplate || !!customColors)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [paletteName, setPaletteName] = useState('')
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null)

  // Keep a local copy of colors for debouncing
  const template = getTemplate(selectedId)
  const activeColors = customColors ?? template.defaultColors
  const colorsWithSectionBg: CustomColors = {
    ...activeColors,
    sectionBackground:
      activeColors.sectionBackground || computeSectionBgDefault(activeColors.secondary),
  }
  const [localColors, setLocalColors] = useState<CustomColors>(colorsWithSectionBg)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local colors when customColors or selectedId changes externally
  useEffect(() => {
    const t = getTemplate(selectedId)
    const base = customColors ?? t.defaultColors
    setLocalColors({
      ...base,
      sectionBackground: base.sectionBackground || computeSectionBgDefault(base.secondary),
    })
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
      // Auto-update section background when secondary changes and user hasn't manually set it
      if (key === 'secondary' && !customColors?.sectionBackground) {
        updated.sectionBackground = computeSectionBgDefault(value)
      }
      setLocalColors(updated)
      debouncedUpdate(updated)
    },
    [localColors, debouncedUpdate, customColors?.sectionBackground],
  )

  const handleHexInput = useCallback(
    (key: keyof CustomColors, value: string) => {
      const updated = { ...localColors, [key]: value }
      if (key === 'secondary' && !customColors?.sectionBackground && HEX_REGEX.test(value)) {
        updated.sectionBackground = computeSectionBgDefault(value)
      }
      setLocalColors(updated)
      if (HEX_REGEX.test(value)) {
        debouncedUpdate(updated)
      }
    },
    [localColors, debouncedUpdate, customColors?.sectionBackground],
  )

  const handleFontChange = useCallback(
    (fontPairId: string) => {
      onCustomize({ fontPair: fontPairId })
    },
    [onCustomize],
  )

  const handleReset = useCallback(() => {
    const t = getTemplate(selectedId)
    const reset: CustomColors = {
      ...t.defaultColors,
      sectionBackground: computeSectionBgDefault(t.defaultColors.secondary),
    }
    setLocalColors(reset)
    onCustomize({ customColors: reset, fontPair: t.fontPair })
    setActivePaletteId(null)
  }, [selectedId, onCustomize])

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      if (templateId === 'custom') {
        // Just switch to custom template without resetting colors
        onSelect(templateId)
        setShowCustomizer(true)
        return
      }
      onSelect(templateId)
      // When switching to a non-custom template, apply that template's defaults
      const t = getTemplate(templateId)
      const colors: CustomColors = {
        ...t.defaultColors,
        sectionBackground: computeSectionBgDefault(t.defaultColors.secondary),
      }
      setLocalColors(colors)
      onCustomize({ customColors: colors, fontPair: t.fontPair })
      setActivePaletteId(null)
    },
    [onSelect, onCustomize],
  )

  const handleSavePalette = useCallback(() => {
    if (!paletteName.trim()) return
    const newPalette: SavedPalette = {
      id: generatePaletteId(),
      name: paletteName.trim(),
      colors: { ...localColors },
      fontPair,
    }
    const existing = savedPalettes ?? []
    onCustomize({ savedPalettes: [...existing, newPalette] })
    setActivePaletteId(newPalette.id)
    setPaletteName('')
    setShowSaveDialog(false)
  }, [paletteName, localColors, fontPair, savedPalettes, onCustomize])

  const handleLoadPalette = useCallback(
    (palette: SavedPalette) => {
      const colors: CustomColors = {
        ...palette.colors,
        sectionBackground:
          palette.colors.sectionBackground || computeSectionBgDefault(palette.colors.secondary),
      }
      setLocalColors(colors)
      onCustomize({ customColors: colors, fontPair: palette.fontPair })
      setActivePaletteId(palette.id)
      // Switch to custom template when loading a saved palette
      if (selectedId !== 'custom') {
        onSelect('custom')
      }
      setShowCustomizer(true)
    },
    [onCustomize, onSelect, selectedId],
  )

  const handleDeletePalette = useCallback(
    (paletteId: string) => {
      const existing = savedPalettes ?? []
      const updated = existing.filter((p) => p.id !== paletteId)
      onCustomize({ savedPalettes: updated.length > 0 ? updated : null })
      if (activePaletteId === paletteId) setActivePaletteId(null)
    },
    [savedPalettes, onCustomize, activePaletteId],
  )

  const handleUpdatePalette = useCallback(() => {
    if (!activePaletteId) return
    const existing = savedPalettes ?? []
    const updated = existing.map((p) =>
      p.id === activePaletteId ? { ...p, colors: { ...localColors }, fontPair } : p,
    )
    onCustomize({ savedPalettes: updated })
  }, [activePaletteId, savedPalettes, localColors, fontPair, onCustomize])

  const palettes = savedPalettes ?? []

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose a Template</h3>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {templates.map((t) => (
          <TemplatePreview
            key={t.id}
            templateId={t.id}
            selected={t.id === selectedId}
            onClick={() => handleTemplateSelect(t.id)}
          />
        ))}
      </div>

      {/* Saved custom palettes */}
      {palettes.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Your Saved Palettes</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {palettes.map((palette) => (
              <div
                key={palette.id}
                className={`group relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                  activePaletteId === palette.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => handleLoadPalette(palette)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{palette.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePalette(palette.id)
                    }}
                    className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {(['primary', 'secondary', 'accent', 'background'] as const).map((key) => (
                    <div
                      key={key}
                      className="h-6 w-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: palette.colors[key] }}
                      title={key}
                    />
                  ))}
                  {palette.colors.sectionBackground && (
                    <div
                      className="h-6 w-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: palette.colors.sectionBackground }}
                      title="Section tint"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customize Colors toggle */}
      <button
        type="button"
        onClick={() => setShowCustomizer((v) => !v)}
        className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <Palette className="h-4 w-4" />
        Customize Colors & Font
        {showCustomizer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Color customization panel */}
      {showCustomizer && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Customize Colors</h4>

          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_FIELDS.map(({ key, label }) => {
              const colorValue = localColors[key] ?? ''
              return (
                <div key={key} className="flex items-center gap-3">
                  <Label htmlFor={`color-${key}`} className="w-24 shrink-0 text-sm text-gray-700">
                    {label}
                  </Label>
                  <div className="relative">
                    <input
                      type="color"
                      id={`color-picker-${key}`}
                      value={HEX_REGEX.test(colorValue) ? colorValue : '#000000'}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5"
                    />
                  </div>
                  <Input
                    id={`color-${key}`}
                    value={colorValue}
                    onChange={(e) => handleHexInput(key, e.target.value)}
                    placeholder="#000000"
                    className="h-9 w-28 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              )
            })}
          </div>

          <div className="mt-5 border-t border-gray-200 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Font Style</h4>
            <FontPreviewPicker selected={fontPair} onSelect={handleFontChange} />

            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Typography Options</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-600">Headings</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localColors,
                          headingBold: !(localColors.headingBold ?? true),
                        }
                        setLocalColors(updated)
                        debouncedUpdate(updated)
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                        (localColors.headingBold ?? true)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localColors,
                          headingItalic: !(localColors.headingItalic ?? false),
                        }
                        setLocalColors(updated)
                        debouncedUpdate(updated)
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs italic transition-colors ${
                        (localColors.headingItalic ?? false)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      I
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] text-gray-500">Size</p>
                    <div className="flex gap-1">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const updated = { ...localColors, headingSize: opt.value }
                            setLocalColors(updated)
                            debouncedUpdate(updated)
                          }}
                          className={`rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                            (localColors.headingSize ?? 'md') === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-600">Body Text</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localColors,
                          bodyBold: !(localColors.bodyBold ?? false),
                        }
                        setLocalColors(updated)
                        debouncedUpdate(updated)
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                        (localColors.bodyBold ?? false)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...localColors,
                          bodyItalic: !(localColors.bodyItalic ?? false),
                        }
                        setLocalColors(updated)
                        debouncedUpdate(updated)
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs italic transition-colors ${
                        (localColors.bodyItalic ?? false)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      I
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] text-gray-500">Size</p>
                    <div className="flex gap-1">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const updated = { ...localColors, bodySize: opt.value }
                            setLocalColors(updated)
                            debouncedUpdate(updated)
                          }}
                          className={`rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                            (localColors.bodySize ?? 'md') === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save / Update palette actions */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            {showSaveDialog ? (
              <div className="flex items-center gap-2">
                <Input
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  placeholder="Palette name (e.g. Navy & Gold)"
                  className="h-9 flex-1 text-sm"
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePalette()
                    if (e.key === 'Escape') setShowSaveDialog(false)
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleSavePalette} disabled={!paletteName.trim()}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setPaletteName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Save as New Palette
                </Button>
                {activePaletteId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUpdatePalette}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Update Current Palette
                  </Button>
                )}
              </div>
            )}
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
