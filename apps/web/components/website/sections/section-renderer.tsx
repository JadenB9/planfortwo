'use client'

import type { WebsiteSection, WebsitePhoto, GuestbookEntry } from '@planfortwo/types'
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
} from '@planfortwo/types'
import { HeroSection } from './hero-section'
import { OurStorySection } from './our-story-section'
import { EventDetailsSection } from './event-details-section'
import { WeddingPartySection } from './wedding-party-section'
import { GallerySection } from './gallery-section'
import { TravelSection } from './travel-section'
import { ThingsToDoSection } from './things-to-do-section'
import { RegistrySection } from './registry-section'
import { FaqSection } from './faq-section'
import { RsvpSection } from './rsvp-section'
import { ScheduleSection } from './schedule-section'
import { GuestbookSection } from './guestbook-section'
import { CustomSection } from './custom-section'

interface SectionRendererProps {
  section: WebsiteSection
  photos: WebsitePhoto[]
  guestbookEntries: GuestbookEntry[]
  weddingName: string
  weddingDate: Date | null
  slug: string
  onGuestbookSubmit?: (authorName: string, message: string) => Promise<void>
}

export function SectionRenderer({
  section,
  photos,
  guestbookEntries,
  weddingName,
  weddingDate,
  slug,
  onGuestbookSubmit,
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
          photos={sectionPhotos.length > 0 ? sectionPhotos : photos}
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
          weddingId={section.weddingId}
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
    default:
      return null
  }
}
