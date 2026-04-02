'use client'

import type { WebsiteSection, WebsitePhoto, GuestbookEntry } from '@planfortwo/types'
import dynamic from 'next/dynamic'
import type {
  HeroContent,
  OurStoryContent,
  EventDetailsContent,
  WeddingPartyContent,
  GalleryContent,
  TravelContent,
  ThingsToDoContent,
  RegistryContent,
  FaqContent,
  RsvpSectionContent,
  ScheduleContent,
  GuestbookSectionContent,
  CustomSectionContent,
  SongRequestsSectionContent,
  PrayersSectionContent,
  Prayer,
} from '@planfortwo/types'

const HeroSection = dynamic(() => import('./hero-section').then((mod) => mod.HeroSection))
const OurStorySection = dynamic(() => import('./our-story-section').then((mod) => mod.OurStorySection))
const EventDetailsSection = dynamic(() =>
  import('./event-details-section').then((mod) => mod.EventDetailsSection),
)
const WeddingPartySection = dynamic(() =>
  import('./wedding-party-section').then((mod) => mod.WeddingPartySection),
)
const GallerySection = dynamic(() => import('./gallery-section').then((mod) => mod.GallerySection))
const TravelSection = dynamic(() => import('./travel-section').then((mod) => mod.TravelSection))
const ThingsToDoSection = dynamic(() =>
  import('./things-to-do-section').then((mod) => mod.ThingsToDoSection),
)
const RegistrySection = dynamic(() =>
  import('./registry-section').then((mod) => mod.RegistrySection),
)
const FaqSection = dynamic(() => import('./faq-section').then((mod) => mod.FaqSection))
const RsvpSection = dynamic(() => import('./rsvp-section').then((mod) => mod.RsvpSection))
const ScheduleSection = dynamic(() =>
  import('./schedule-section').then((mod) => mod.ScheduleSection),
)
const GuestbookSection = dynamic(() =>
  import('./guestbook-section').then((mod) => mod.GuestbookSection),
)
const CustomSection = dynamic(() => import('./custom-section').then((mod) => mod.CustomSection))
const SongRequestsSection = dynamic(() =>
  import('./song-requests-section').then((mod) => mod.SongRequestsSection),
)
const PrayersSection = dynamic(() => import('./prayers-section').then((mod) => mod.PrayersSection))

interface GuestPhoto {
  id: string
  url: string
  caption: string | null
  uploaderName: string | null
  createdAt: Date | string
}

interface SectionRendererProps {
  section: Omit<WebsiteSection, 'weddingId'>
  photos: Omit<WebsitePhoto, 'weddingId'>[]
  guestPhotos?: GuestPhoto[]
  guestbookEntries: GuestbookEntry[]
  prayerEntries?: Prayer[]
  weddingName: string
  weddingDate: Date | null
  slug: string
  onGuestbookSubmit?: (authorName: string, message: string) => Promise<void>
  onPrayerSubmit?: (authorName: string, prayerText: string) => Promise<void>
}

export function SectionRenderer({
  section,
  photos,
  guestPhotos,
  guestbookEntries,
  prayerEntries,
  weddingName,
  weddingDate,
  slug,
  onGuestbookSubmit,
  onPrayerSubmit,
}: SectionRendererProps) {
  if (!section.isVisible) return null

  const sectionPhotos = photos.filter((p) => p.sectionId === section.id)

  switch (section.sectionType) {
    case 'hero':
      return (
        <HeroSection
          content={section.content as unknown as HeroContent}
          weddingName={weddingName}
          weddingDate={weddingDate}
        />
      )
    case 'our_story':
      return (
        <OurStorySection
          title={section.title}
          content={section.content as unknown as OurStoryContent}
        />
      )
    case 'event_details':
      return (
        <EventDetailsSection
          title={section.title}
          content={section.content as unknown as EventDetailsContent}
        />
      )
    case 'wedding_party':
      return (
        <WeddingPartySection
          title={section.title}
          content={section.content as unknown as WeddingPartyContent}
        />
      )
    case 'gallery':
      return (
        <GallerySection
          title={section.title}
          content={section.content as unknown as GalleryContent}
          photos={(sectionPhotos.length > 0 ? sectionPhotos : photos) as WebsitePhoto[]}
          slug={slug}
          guestPhotos={guestPhotos}
        />
      )
    case 'travel':
      return (
        <TravelSection
          title={section.title}
          content={section.content as unknown as TravelContent}
        />
      )
    case 'things_to_do':
      return (
        <ThingsToDoSection
          title={section.title}
          content={section.content as unknown as ThingsToDoContent}
        />
      )
    case 'registry':
      return (
        <RegistrySection
          title={section.title}
          content={section.content as unknown as RegistryContent}
        />
      )
    case 'faq':
      return <FaqSection title={section.title} content={section.content as unknown as FaqContent} />
    case 'rsvp':
      return (
        <RsvpSection
          title={section.title}
          content={section.content as unknown as RsvpSectionContent}
          slug={slug}
        />
      )
    case 'schedule':
      return (
        <ScheduleSection
          title={section.title}
          content={section.content as unknown as ScheduleContent}
        />
      )
    case 'guestbook':
      return (
        <GuestbookSection
          title={section.title}
          content={section.content as unknown as GuestbookSectionContent}
          entries={guestbookEntries}
          slug={slug}
          onSubmit={onGuestbookSubmit}
        />
      )
    case 'custom':
      return (
        <CustomSection
          title={section.title}
          content={section.content as unknown as CustomSectionContent}
        />
      )
    case 'song_requests':
      return (
        <SongRequestsSection
          title={section.title}
          content={section.content as unknown as SongRequestsSectionContent}
          slug={slug}
        />
      )
    case 'prayers':
      return (
        <PrayersSection
          title={section.title}
          content={section.content as unknown as PrayersSectionContent}
          entries={prayerEntries ?? []}
          slug={slug}
          onSubmit={onPrayerSubmit}
        />
      )
    default:
      return null
  }
}
