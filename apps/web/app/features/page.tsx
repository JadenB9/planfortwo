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
import { Separator } from '@/components/ui/separator'
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
    description:
      'Keep all your vendor contacts, contracts, and payments organized in one place.',
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
    description:
      'Manage your gift registry, track received gifts, and send thank-you notes.',
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
    description:
      'Plan every detail of your ceremony from vows to the processional order.',
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
    description:
      'Build the perfect soundtrack for your wedding with collaborative playlist tools.',
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
    description:
      'Manage your wedding details, notification preferences, and account settings.',
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
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-sage-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="font-serif text-xl font-bold text-gray-900">
            PlanForTwo
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Home
            </Link>
            <Button
              asChild
              size="sm"
              className="rounded-lg bg-wedding-600 text-white hover:bg-wedding-700"
            >
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-sage-50 to-white px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <AnimatedSection>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Everything you need to plan your perfect wedding
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              From guest lists to budgets, checklists to websites — plan your
              wedding stress-free with tools designed for couples, not
              corporations.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built for real couples
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Every feature is designed with couples in mind — no bloat, no
              complexity, just the tools you actually need.
            </p>
          </AnimatedSection>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featureCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <AnimatedSection
                  key={category.title}
                  delay={index * 0.1}
                >
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-100">
                          <Icon className="h-5 w-5 text-sage-700" />
                        </div>
                        <CardTitle className="text-lg">
                          {category.title}
                        </CardTitle>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {category.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
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

      <Separator className="mx-auto max-w-6xl" />

      {/* Pricing Comparison */}
      <section className="bg-cream-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              No subscriptions. No hidden fees. Pay once and plan your wedding
              with everything you need.
            </p>
          </AnimatedSection>

          <div className="mt-16">
            <PricingCards>
              <PricingCard
                title="Free"
                price="Free"
                description="Get a taste of PlanForTwo with essential planning tools."
                features={freePlanFeatures}
                cta="Start Free"
                href="/dashboard"
                delay={0.1}
              />
              <PricingCard
                title="Full Access"
                price="$200"
                description="Everything unlimited. Every feature. One payment."
                features={fullPlanFeatures}
                cta="Get Full Access"
                href="/dashboard"
                highlighted
                delay={0.2}
              />
            </PricingCards>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <AnimatedSection className="text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Everything you need to know about PlanForTwo pricing and features.
            </p>
          </AnimatedSection>

          <AnimatedSection className="mt-12" delay={0.1}>
            <FaqSection />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-white to-sage-50 px-4 py-20 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to start planning?
          </h2>
          <p className="mt-4 text-gray-600">
            Join thousands of couples who chose a simpler way to plan their
            wedding.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-wedding-600 px-8 text-white hover:bg-wedding-700"
            >
              <Link href="/dashboard">Start Free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl px-8"
            >
              <Link href="/dashboard">Get Full Access</Link>
            </Button>
          </div>
        </AnimatedSection>
      </section>
    </main>
  )
}
