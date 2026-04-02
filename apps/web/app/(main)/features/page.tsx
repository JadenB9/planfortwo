'use client'

import Link from 'next/link'
import {
  CheckSquare,
  Users,
  DollarSign,
  Globe,
  LayoutGrid,
  Building2,
  Mail,
  Calendar,
  Camera,
  Gift,
  Heart,
  Music,
  Plane,
  Settings,
  type LucideIcon,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavBar } from '@/components/layout/nav-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { AnimatedSection } from '@/components/features/animated-section'
import { PricingCard, PricingCards } from '@/components/features/pricing-card'
import { InteractiveFeatureCard } from '@/components/features/interactive-feature-card'

interface FeatureCategory {
  icon: LucideIcon
  title: string
  description: string
  items: string[]
  accent: string
  accentLight: string
}

const featureCategories: FeatureCategory[] = [
  {
    icon: CheckSquare,
    title: 'Planning & Checklist',
    description:
      'Stay on track with a comprehensive, customizable wedding checklist that adapts to your timeline.',
    items: [
      'Pre-built templates with 50+ tasks',
      'Custom categories and priorities',
      'Notes and attachments per task',
      'Drag-and-drop reordering',
      'File attachments for contracts and inspiration',
    ],
    accent: '#5B7A5E',
    accentLight: '#EDF2ED',
  },
  {
    icon: Users,
    title: 'Guest Management',
    description:
      'Manage your entire guest list with powerful tools for tracking RSVPs, dietary needs, and more.',
    items: [
      'Unlimited guest entries',
      'Real-time RSVP tracking',
      'CSV import and export',
      'Tags for grouping (family, friends, work)',
      'Household grouping and plus-ones',
    ],
    accent: '#C17F59',
    accentLight: '#FDF2EB',
  },
  {
    icon: DollarSign,
    title: 'Budget Tracker',
    description:
      'Take control of your wedding finances with detailed tracking, analytics, and smart insights.',
    items: [
      'Pre-built budget categories',
      'Expense tracking with receipts',
      'Visual analytics and breakdowns',
      'CSV and PDF export',
      'Payment schedule and reminders',
    ],
    accent: '#8B7355',
    accentLight: '#F5F0EA',
  },
  {
    icon: Globe,
    title: 'Wedding Website',
    description:
      'Create a stunning wedding website to share your story, event details, and collect RSVPs.',
    items: [
      '10 professionally designed templates',
      'Custom sections and pages',
      'Photo galleries',
      'Built-in visitor analytics',
      'Custom domain support',
    ],
    accent: '#4A6E5C',
    accentLight: '#E9F0EC',
  },
  {
    icon: LayoutGrid,
    title: 'Seating Chart',
    description:
      'Design your reception layout with an intuitive drag-and-drop seating chart builder.',
    items: [
      'Visual table layout editor',
      'Drag-and-drop guest assignment',
      'Table capacity management',
      'Dietary restriction flags',
      'Print-ready export',
    ],
    accent: '#7A6B8A',
    accentLight: '#F0ECF4',
  },
  {
    icon: Building2,
    title: 'Vendor Management',
    description: 'Keep all your vendor contacts, contracts, and payments organized in one place.',
    items: [
      'Vendor directory and search',
      'Contract and document storage',
      'Payment tracking per vendor',
      'Review and rating system',
      'Communication log',
    ],
    accent: '#5A7A8A',
    accentLight: '#EBF1F4',
  },
  {
    icon: Calendar,
    title: 'Events & Timeline',
    description:
      'Plan every event leading up to and including your big day with a visual timeline.',
    items: [
      'Event planning and scheduling',
      'Timeline builder',
      'Day-of schedule',
      'Rehearsal dinner coordination',
      'Vendor arrival times',
    ],
    accent: '#8A6B5A',
    accentLight: '#F4EEEB',
  },
  {
    icon: Camera,
    title: 'Photos & Gallery',
    description:
      'Collect and organize all your wedding photos in one beautiful, shareable gallery.',
    items: [
      'Photo uploads and organization',
      'Guest photo submissions',
      'Photo moderation tools',
      'Shareable gallery links',
      'Download and print options',
    ],
    accent: '#6B7A5A',
    accentLight: '#EFF2EB',
  },
  {
    icon: Gift,
    title: 'Registry & Gifts',
    description: 'Manage your gift registry, track received gifts, and send thank-you notes.',
    items: [
      'Registry links and wishlists',
      'Cash fund setup',
      'Gift tracking and status',
      'Thank-you note manager',
      'Gift receipt confirmations',
    ],
    accent: '#C17F59',
    accentLight: '#FDF2EB',
  },
  {
    icon: Heart,
    title: 'Ceremony Planning',
    description: 'Plan every detail of your ceremony from vows to the processional order.',
    items: [
      'Ceremony outline builder',
      'Vow workspace and drafts',
      'Processional order planner',
      'Reading and music selections',
      'Officiant coordination',
    ],
    accent: '#B07070',
    accentLight: '#F6EDED',
  },
  {
    icon: Music,
    title: 'Music & Playlists',
    description: 'Build the perfect soundtrack for your wedding with collaborative playlist tools.',
    items: [
      'Playlist builder for each event',
      'Guest song requests',
      'DJ and band coordination',
      'Do-not-play list',
      'First dance and special song picks',
    ],
    accent: '#5B7A5E',
    accentLight: '#EDF2ED',
  },
  {
    icon: Plane,
    title: 'Honeymoon Planning',
    description:
      'Plan your dream honeymoon with destination research, itineraries, and packing lists.',
    items: [
      'Destination planning and research',
      'Itinerary builder',
      'Packing list generator',
      'Travel document checklist',
      'Budget tracking for trips',
    ],
    accent: '#5A7A8A',
    accentLight: '#EBF1F4',
  },
  {
    icon: Mail,
    title: 'Communication & Stationery',
    description:
      'Design and send beautiful digital invitations, save-the-dates, and thank-you cards.',
    items: [
      'Digital invitation templates',
      'Save-the-date designs',
      'Thank-you card builder',
      'Email campaign tracking',
      'Guest communication history',
    ],
    accent: '#7A6B8A',
    accentLight: '#F0ECF4',
  },
  {
    icon: Settings,
    title: 'Settings & Account',
    description: 'Manage your wedding details, notification preferences, and account settings.',
    items: [
      'Wedding details and date management',
      'Notification preferences',
      'Partner account management',
      'Data export and backup',
      'Privacy and sharing controls',
    ],
    accent: '#6B7A8A',
    accentLight: '#EDF0F4',
  },
]

const freePlanFeatures = [
  { label: 'Full checklist editing & customization', included: true },
  { label: 'Unlimited guests & RSVP tracking', included: true },
  { label: 'Complete budget tracking & analytics', included: true },
  { label: 'Vendor management', included: true },
  { label: 'Events & timeline planning', included: true },
  { label: 'Registry & gift tracking', included: true },
  { label: 'Ceremony & honeymoon planning', included: true },
  { label: 'CSV & PDF data export', included: true },
  { label: 'Partner collaboration', included: true },
  { label: 'Website builder & customization', included: false },
  { label: 'Custom seating chart builder', included: false },
  { label: 'Inbox & email system', included: false },
  { label: 'Spotify music integration', included: false },
  { label: 'Photo gallery & uploads', included: false },
  { label: 'Email campaigns & messaging', included: false },
  { label: 'Custom domain', included: false },
]

const fullPlanFeatures = [
  { label: 'Everything in Free plan', included: true },
  { label: 'Website builder & customization', included: true },
  { label: 'All 10 website templates', included: true },
  { label: 'Website visitor analytics', included: true },
  { label: 'Custom seating chart builder', included: true },
  { label: 'Inbox & email system', included: true },
  { label: 'Spotify music integration', included: true },
  { label: 'Photo gallery & uploads', included: true },
  { label: 'Email campaigns & messaging', included: true },
  { label: 'Custom domain support', included: true },
  { label: 'Every future premium feature', included: true },
]

export default function FeaturesPage() {
  return (
    <main className="bg-background min-h-screen">
      <NavBar />

      {/* Hero */}
      <section className="px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedSection>
            <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wide">
              Everything included
            </p>
            <h1 className="text-foreground font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Tools that actually help you plan
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
              From guest lists to budgets, checklists to websites — plan your wedding with tools
              designed for couples, not corporations.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="mb-16 max-w-2xl">
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              14 feature areas
            </span>
            <h2 className="text-foreground font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Built for real couples
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">
              Every feature is designed with couples in mind — no bloat, no complexity, just the
              tools you actually need. Hover to explore.
            </p>
          </AnimatedSection>

          <div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            style={{ perspective: '1200px' }}
          >
            {featureCategories.map((category, index) => (
              <InteractiveFeatureCard
                key={category.title}
                icon={category.icon}
                title={category.title}
                description={category.description}
                items={category.items}
                index={index}
                accent={category.accent}
                accentLight={category.accentLight}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/50 scroll-mt-24 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="mb-16 text-center">
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              Pricing
            </span>
            <h2 className="text-foreground font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed">
              No subscriptions. No hidden fees. Pay once and plan your wedding with everything you
              need.
            </p>
          </AnimatedSection>

          <PricingCards>
            <PricingCard
              title="Free"
              price="Free"
              description="Get a taste of PlanForTwo with essential planning tools."
              features={freePlanFeatures}
              cta="Start Free"
              href="/sign-up"
              delay={0.1}
            />
            <PricingCard
              title="Full Access"
              price="$10"
              description="Premium tools to make your wedding perfect."
              features={fullPlanFeatures}
              cta="Get Full Access"
              href="/upgrade"
              highlighted
              delay={0.2}
            />
          </PricingCards>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground px-5 py-20 sm:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="text-background font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start planning?
          </h2>
          <p className="text-background/60 mt-4 text-base leading-relaxed">
            Create your free account and start organizing your wedding in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 rounded-xl px-8 text-sm font-medium"
            >
              <Link href="/sign-up">Start Free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-xl border-0 bg-orange-500 px-8 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              <Link href="/upgrade">
                Get Full Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </AnimatedSection>
      </section>

      <SiteFooter />
    </main>
  )
}
