export interface DefaultWebsiteSection {
  sectionType: string
  title: string
  content: Record<string, unknown>
  isVisible: boolean
  sortOrder: number
}

export const defaultWebsiteSections: DefaultWebsiteSection[] = [
  {
    sectionType: 'hero',
    title: 'Welcome',
    content: {
      headline: '',
      subheadline: "We're getting married!",
      backgroundImageUrl: null,
      showDate: true,
      showCountdown: true,
    },
    isVisible: true,
    sortOrder: 0,
  },
  {
    sectionType: 'our_story',
    title: 'Our Story',
    content: {
      body: '',
      timelineEvents: [],
    },
    isVisible: true,
    sortOrder: 1,
  },
  {
    sectionType: 'event_details',
    title: 'Event Details',
    content: {
      events: [
        {
          name: 'Ceremony',
          date: null,
          time: null,
          venue: '',
          address: '',
          description: '',
        },
        {
          name: 'Reception',
          date: null,
          time: null,
          venue: '',
          address: '',
          description: '',
        },
      ],
    },
    isVisible: true,
    sortOrder: 2,
  },
  {
    sectionType: 'wedding_party',
    title: 'Wedding Party',
    content: {
      members: [],
    },
    isVisible: true,
    sortOrder: 3,
  },
  {
    sectionType: 'gallery',
    title: 'Photos',
    content: {
      layout: 'grid',
      columns: 3,
    },
    isVisible: true,
    sortOrder: 4,
  },
  {
    sectionType: 'travel',
    title: 'Travel & Accommodations',
    content: {
      accommodations: [],
      directions: '',
      mapEmbed: null,
    },
    isVisible: true,
    sortOrder: 5,
  },
  {
    sectionType: 'things_to_do',
    title: 'Things to Do',
    content: {
      activities: [],
    },
    isVisible: false,
    sortOrder: 6,
  },
  {
    sectionType: 'registry',
    title: 'Registry',
    content: {
      message: '',
      registries: [],
    },
    isVisible: true,
    sortOrder: 7,
  },
  {
    sectionType: 'faq',
    title: 'FAQ',
    content: {
      questions: [],
    },
    isVisible: true,
    sortOrder: 8,
  },
  {
    sectionType: 'rsvp',
    title: 'RSVP',
    content: {
      message: 'Please let us know if you can make it!',
      showDietary: true,
      showSongRequest: true,
    },
    isVisible: true,
    sortOrder: 9,
  },
  {
    sectionType: 'schedule',
    title: 'Schedule',
    content: {
      items: [],
    },
    isVisible: false,
    sortOrder: 10,
  },
  {
    sectionType: 'guestbook',
    title: 'Guestbook',
    content: {
      requireApproval: true,
      message: 'Leave us a message!',
    },
    isVisible: false,
    sortOrder: 11,
  },
]
