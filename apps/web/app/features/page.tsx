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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NavBar } from '@/components/layout/nav-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { AnimatedSection } from '@/components/features/animated-section'
import { PricingCard, PricingCards } from '@/components/features/pricing-card'
import { FaqSection } from '@/components/features/faq-section'

interface FeatureCategory {
  icon: LucideIcon
  title: string
  description: string
  items: string[]
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
  },
]

const freePlanFeatures = [
  { label: 'Checklist (view only)', included: true },
  { label: 'Up to 15 guests', included: true },
  { label: '1 basic website template', included: true },
  { label: 'Budget total overview', included: true },
  { label: 'Full checklist editing', included: false },
  { label: 'Unlimited guests', included: false },
  { label: 'RSVP tracking', included: false },
  { label: 'All 10 website templates', included: false },
  { label: 'Custom domain', included: false },
  { label: 'Budget analytics & export', included: false },
  { label: 'CSV and PDF data export', included: false },
  { label: 'Seating chart builder', included: false },
  { label: 'Vendor management', included: false },
  { label: 'Event timeline & scheduling', included: false },
  { label: 'Photo gallery & submissions', included: false },
  { label: 'Registry & gift tracking', included: false },
  { label: 'Ceremony & music planning', included: false },
  { label: 'Honeymoon planning', included: false },
  { label: 'Priority support', included: false },
]

const fullPlanFeatures = [
  { label: 'Checklist (view only)', included: true },
  { label: 'Up to 15 guests', included: true },
  { label: '1 basic website template', included: true },
  { label: 'Budget total overview', included: true },
  { label: 'Full checklist editing', included: true },
  { label: 'Unlimited guests', included: true },
  { label: 'RSVP tracking', included: true },
  { label: 'All 10 website templates', included: true },
  { label: 'Custom domain', included: true },
  { label: 'Budget analytics & export', included: true },
  { label: 'CSV and PDF data export', included: true },
  { label: 'Seating chart builder', included: true },
  { label: 'Vendor management', included: true },
  { label: 'Event timeline & scheduling', included: true },
  { label: 'Photo gallery & submissions', included: true },
  { label: 'Registry & gift tracking', included: true },
  { label: 'Ceremony & music planning', included: true },
  { label: 'Honeymoon planning', included: true },
  { label: 'Priority support', included: true },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <NavBar />

      {/* Hero */}
      <section className="px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedSection>
            <p className="mb-4 text-sm font-medium tracking-wide text-gray-400">
              Everything included
            </p>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Tools that actually help you plan
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
              From guest lists to budgets, checklists to websites — plan your wedding
              with tools designed for couples, not corporations.
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
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built for real couples
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              Every feature is designed with couples in mind — no bloat, no complexity, just the
              tools you actually need.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <AnimatedSection key={category.title} delay={Math.min(index * 0.05, 0.4)}>
                  <Card className="h-full border-gray-100 bg-white transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="bg-sage-50 flex h-10 w-10 items-center justify-center rounded-lg">
                          <Icon className="text-sage-600 h-5 w-5" />
                        </div>
                        <CardTitle className="text-base">{category.title}</CardTitle>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        {category.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="bg-sage-300 mt-1.5 h-1 w-1 shrink-0 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 bg-[#FFFCF7] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="mb-16 text-center">
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              Pricing
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
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
              price="$200"
              description="Everything unlimited. Every feature. One payment."
              features={fullPlanFeatures}
              cta="Get Full Access"
              href="/upgrade"
              highlighted
              delay={0.2}
            />
          </PricingCards>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <AnimatedSection className="mb-12 text-center">
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              FAQ
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Common questions
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <FaqSection />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 px-5 py-20 sm:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to start planning?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-400">
            Create your free account and start organizing your wedding in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-white px-8 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              <Link href="/sign-up">Start Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-gray-700 px-8 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Link href="/upgrade">Get Full Access</Link>
            </Button>
          </div>
        </AnimatedSection>
      </section>

      <SiteFooter />
    </main>
  )
}
