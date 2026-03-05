import type { CustomColors } from '@planfortwo/types'

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  previewImage: string
  defaultColors: CustomColors
  fontPair: string
  tags: string[]
}

export const templates: TemplateMetadata[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless elegance with serif typography and warm neutrals',
    previewImage: '/templates/classic.jpg',
    defaultColors: {
      primary: '#8B7355',
      secondary: '#D4C5B2',
      accent: '#C9A96E',
      background: '#FDF8F4',
    },
    fontPair: 'playfair-lato',
    tags: ['traditional', 'elegant'],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines, bold contrast, and contemporary sans-serif type',
    previewImage: '/templates/modern.jpg',
    defaultColors: {
      primary: '#1A1A1A',
      secondary: '#F5F5F5',
      accent: '#C9A96E',
      background: '#FFFFFF',
    },
    fontPair: 'josefin-open-sans',
    tags: ['minimal', 'contemporary'],
  },
  {
    id: 'rustic',
    name: 'Rustic',
    description: 'Warm earth tones with textured backgrounds and organic feel',
    previewImage: '/templates/rustic.jpg',
    defaultColors: {
      primary: '#5C4033',
      secondary: '#E8DDD3',
      accent: '#8B6F47',
      background: '#FAF5EF',
    },
    fontPair: 'libre-baskerville-source-sans',
    tags: ['country', 'natural'],
  },
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Soft blush tones with flowing script and floral accents',
    previewImage: '/templates/romantic.jpg',
    defaultColors: {
      primary: '#B76E79',
      secondary: '#F5E6E8',
      accent: '#D4A574',
      background: '#FFF5F5',
    },
    fontPair: 'great-vibes-montserrat',
    tags: ['soft', 'floral'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Maximum whitespace, restrained palette, and purposeful simplicity',
    previewImage: '/templates/minimalist.jpg',
    defaultColors: {
      primary: '#333333',
      secondary: '#E8E8E8',
      accent: '#666666',
      background: '#FFFFFF',
    },
    fontPair: 'josefin-open-sans',
    tags: ['simple', 'clean'],
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    description: 'Free-spirited with warm terracotta, sage, and eclectic type',
    previewImage: '/templates/bohemian.jpg',
    defaultColors: {
      primary: '#C2674A',
      secondary: '#E4EBE4',
      accent: '#D07D56',
      background: '#FDF8F6',
    },
    fontPair: 'dancing-script-nunito',
    tags: ['boho', 'eclectic'],
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Lush greens, botanical illustrations, and nature-inspired palette',
    previewImage: '/templates/garden.jpg',
    defaultColors: {
      primary: '#456349',
      secondary: '#E4EBE4',
      accent: '#7A9A7D',
      background: '#F4F7F4',
    },
    fontPair: 'cormorant-fira',
    tags: ['botanical', 'green'],
  },
  {
    id: 'beach',
    name: 'Beach',
    description: 'Ocean blues, sandy warmth, and breezy coastal typography',
    previewImage: '/templates/beach.jpg',
    defaultColors: {
      primary: '#2B6B8A',
      secondary: '#E8F0F2',
      accent: '#D4A574',
      background: '#F8FCFD',
    },
    fontPair: 'dancing-script-nunito',
    tags: ['coastal', 'tropical'],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated gold accents, dark backgrounds, and luxury feel',
    previewImage: '/templates/elegant.jpg',
    defaultColors: {
      primary: '#2C2C2C',
      secondary: '#F0E6D3',
      accent: '#C9A96E',
      background: '#FDFBF7',
    },
    fontPair: 'playfair-lato',
    tags: ['luxury', 'formal'],
  },
  {
    id: 'whimsical',
    name: 'Whimsical',
    description: 'Playful colors, handwritten fonts, and charming illustrations',
    previewImage: '/templates/whimsical.jpg',
    defaultColors: {
      primary: '#6B5B95',
      secondary: '#F0E6F6',
      accent: '#FF6F61',
      background: '#FFF9FB',
    },
    fontPair: 'dancing-script-nunito',
    tags: ['playful', 'fun'],
  },
]

export function getTemplate(templateId: string): TemplateMetadata {
  const found = templates.find((t) => t.id === templateId)
  if (!found) return templates[0] as TemplateMetadata
  return found
}
