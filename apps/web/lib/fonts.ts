import type { FontPair } from '@planfortwo/types'

export interface FontPairConfig {
  id: FontPair
  label: string
  heading: string
  body: string
  headingClass: string
  bodyClass: string
  previewText: string
}

export const fontPairs: FontPairConfig[] = [
  {
    id: 'playfair-lato',
    label: 'Playfair Display + Lato',
    heading: 'Playfair Display',
    body: 'Lato',
    headingClass: 'font-serif',
    bodyClass: 'font-sans',
    previewText: 'Classic elegance',
  },
  {
    id: 'cormorant-fira',
    label: 'Cormorant Garamond + Fira Sans',
    heading: 'Cormorant Garamond',
    body: 'Fira Sans',
    headingClass: 'font-serif',
    bodyClass: 'font-sans',
    previewText: 'Refined beauty',
  },
  {
    id: 'great-vibes-montserrat',
    label: 'Great Vibes + Montserrat',
    heading: 'Great Vibes',
    body: 'Montserrat',
    headingClass: 'font-serif italic',
    bodyClass: 'font-sans',
    previewText: 'Romantic flair',
  },
  {
    id: 'josefin-open-sans',
    label: 'Josefin Sans + Open Sans',
    heading: 'Josefin Sans',
    body: 'Open Sans',
    headingClass: 'font-sans tracking-wide',
    bodyClass: 'font-sans',
    previewText: 'Modern minimal',
  },
  {
    id: 'libre-baskerville-source-sans',
    label: 'Libre Baskerville + Source Sans 3',
    heading: 'Libre Baskerville',
    body: 'Source Sans 3',
    headingClass: 'font-serif',
    bodyClass: 'font-sans',
    previewText: 'Warm tradition',
  },
  {
    id: 'dancing-script-nunito',
    label: 'Dancing Script + Nunito',
    heading: 'Dancing Script',
    body: 'Nunito',
    headingClass: 'font-serif italic',
    bodyClass: 'font-sans',
    previewText: 'Playful charm',
  },
]

export function getFontPair(fontPairId: string): FontPairConfig {
  const found = fontPairs.find((f) => f.id === fontPairId)
  if (!found) return fontPairs[0] as FontPairConfig
  return found
}
