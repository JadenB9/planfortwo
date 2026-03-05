import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Users,
  DollarSign,
  Globe,
  Armchair,
  Store,
  CalendarDays,
  Church,
  Music,
  Camera,
  Gift,
  Plane,
  Mail,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  comingSoon: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, comingSoon: false },
      { href: '/roadmap', label: 'Roadmap', icon: Map, comingSoon: false },
    ],
  },
  {
    label: 'Planning',
    items: [
      { href: '/checklist', label: 'Checklist', icon: CheckSquare, comingSoon: false },
      { href: '/guests', label: 'Guest List', icon: Users, comingSoon: false },
      { href: '/budget', label: 'Budget', icon: DollarSign, comingSoon: false },
      { href: '/website', label: 'Website', icon: Globe, comingSoon: false },
    ],
  },
  {
    label: 'Details',
    items: [
      { href: '/seating', label: 'Seating Chart', icon: Armchair, comingSoon: false },
      { href: '/vendors', label: 'Vendors', icon: Store, comingSoon: false },
      { href: '/events', label: 'Events', icon: CalendarDays, comingSoon: false },
      { href: '/ceremony', label: 'Ceremony', icon: Church, comingSoon: false },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/music', label: 'Music', icon: Music, comingSoon: false },
      { href: '/photos', label: 'Photos', icon: Camera, comingSoon: false },
      { href: '/registry', label: 'Registry', icon: Gift, comingSoon: false },
      { href: '/honeymoon', label: 'Honeymoon', icon: Plane, comingSoon: false },
      { href: '/communication', label: 'Communication', icon: Mail, comingSoon: false },
      { href: '/settings', label: 'Settings', icon: Settings, comingSoon: false },
    ],
  },
]

// Flat list for backwards compat
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)
