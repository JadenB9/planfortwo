import type { Metadata } from 'next'
import type { CustomColors } from '@planfortwo/types'
import { notFound } from 'next/navigation'
import { PublicWebsiteClient } from './client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface PublicWebsiteData {
  config: {
    templateId: string
    customColors: CustomColors | null
    fontPair: string
    privacyMode: string
    metaTitle: string | null
    metaDescription: string | null
    ogImageUrl: string | null
    subdomain: string | null
  }
  sections: Array<{
    id: string
    sectionType:
      | 'hero'
      | 'our_story'
      | 'event_details'
      | 'wedding_party'
      | 'gallery'
      | 'travel'
      | 'things_to_do'
      | 'registry'
      | 'faq'
      | 'rsvp'
      | 'schedule'
      | 'guestbook'
      | 'custom'
      | 'song_requests'
      | 'prayers'
    title: string
    content: Record<string, unknown>
    isVisible: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
  }>
  photos: Array<{
    id: string
    sectionId: string | null
    r2Key: string
    url: string
    fileName: string
    mimeType: string
    fileSize: number
    width: number | null
    height: number | null
    altText: string | null
    sortOrder: number
    createdAt: Date
  }>
  guestPhotos?: Array<{
    id: string
    url: string
    caption: string | null
    uploaderName: string | null
    createdAt: Date
  }>
  weddingName: string
  weddingDate: string | null
  ceremonyDate: string | null
  ceremonyStartTime: string | null
}

async function getWebsiteData(slug: string): Promise<PublicWebsiteData | null> {
  const res = await fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Failed to load website (${res.status})`)
  }
  const json = (await res.json()) as { data: PublicWebsiteData }
  return json.data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getWebsiteData(slug)
  if (!data) return { title: 'Wedding Website' }

  return {
    title: data.config.metaTitle ?? `${data.weddingName} — Wedding`,
    description:
      data.config.metaDescription ?? `Join us to celebrate the wedding of ${data.weddingName}`,
    openGraph: {
      title: data.config.metaTitle ?? `${data.weddingName} — Wedding`,
      description:
        data.config.metaDescription ?? `Join us to celebrate the wedding of ${data.weddingName}`,
      images: data.config.ogImageUrl ? [data.config.ogImageUrl] : [],
    },
  }
}

export default async function PublicWebsitePage({ params }: PageProps) {
  const { slug } = await params
  const data = await getWebsiteData(slug)

  if (!data) notFound()

  if (data.config.privacyMode === 'password') {
    const { PasswordGate } = await import('./password-gate')
    return <PasswordGate slug={slug} weddingName={data.weddingName} />
  }

  return (
    <PublicWebsiteClient
      slug={slug}
      config={data.config}
      sections={data.sections}
      photos={data.photos}
      guestPhotos={data.guestPhotos}
      weddingName={data.weddingName}
      weddingDate={data.weddingDate}
      ceremonyDate={data.ceremonyDate}
      ceremonyStartTime={data.ceremonyStartTime}
    />
  )
}
