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
    sectionType: 'rsvp',
    title: 'RSVP',
    content: {
      message: 'Please let us know if you can make it!',
      showDietary: true,
      showSongRequest: true,
    },
    isVisible: true,
    sortOrder: 2,
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
    isVisible: false,
    sortOrder: 3,
  },
  {
    sectionType: 'wedding_party',
    title: 'Wedding Party',
    content: {
      members: [],
    },
    isVisible: false,
    sortOrder: 4,
  },
  {
    sectionType: 'gallery',
    title: 'Photos',
    content: {
      layout: 'grid',
      columns: 3,
    },
    isVisible: false,
    sortOrder: 5,
  },
  {
    sectionType: 'travel',
    title: 'Travel & Accommodations',
    content: {
      accommodations: [],
      directions: '',
      mapEmbed: null,
    },
    isVisible: false,
    sortOrder: 6,
  },
  {
    sectionType: 'things_to_do',
    title: 'Things to Do',
    content: {
      activities: [],
    },
    isVisible: false,
    sortOrder: 7,
  },
  {
    sectionType: 'registry',
    title: 'Registry',
    content: {
      message: '',
      registries: [],
    },
    isVisible: false,
    sortOrder: 8,
  },
  {
    sectionType: 'faq',
    title: 'FAQ',
    content: {
      questions: [],
    },
    isVisible: false,
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
  {
    sectionType: 'song_requests',
    title: 'Song Requests',
    content: {
      message: 'Help us build our playlist! Request your favorite songs for our celebration.',
      showApproved: false,
    },
    isVisible: false,
    sortOrder: 12,
  },
  {
    sectionType: 'prayers',
    title: 'Prayers',
    content: {
      requireApproval: true,
      message:
        'We would be honored to have your prayers and blessings as we begin this new chapter together.',
    },
    isVisible: false,
    sortOrder: 13,
  },
]
