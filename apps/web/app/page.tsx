'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  Users,
  DollarSign,
  Globe,
  ArrowRight,
  Heart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavBar } from '@/components/layout/nav-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import {
  springSmooth,
  staggerSlow,
  revealUp,
  slideFromLeft,
  slideFromRight,
  drawLine,
} from '@/lib/animations'

const rotatingWords = ['checklists', 'guest lists', 'budgets', 'websites', 'seating charts']

function useParallax(offset: number = 50) {
  const { scrollYProgress } = useScroll()
  return useTransform(scrollYProgress, [0, 1], [0, -offset])
}

function RotatingText() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="text-wedding-600 inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={rotatingWords[index]}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="inline-block"
        >
          {rotatingWords[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ...springSmooth }}
      className="mx-auto mt-16 max-w-4xl"
    >
      <div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-2xl shadow-gray-900/5 sm:p-4">
        {/* Browser chrome */}
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
          </div>
          <div className="ml-4 h-5 flex-1 rounded-md bg-gray-50 px-3">
            <span className="text-[10px] leading-5 text-gray-300">planfortwo.com/dashboard</span>
          </div>
        </div>
        {/* Dashboard mockup */}
        <div className="overflow-hidden rounded-xl bg-[#FAFAF8]">
          <div className="flex min-h-[280px] sm:min-h-[340px]">
            {/* Sidebar */}
            <div className="hidden w-48 border-r border-gray-100 bg-white p-4 sm:block">
              <div className="font-serif text-sm font-bold text-gray-900">PlanForTwo</div>
              <div className="mt-6 space-y-1">
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'Checklist', active: false },
                  { label: 'Guests', active: false },
                  { label: 'Budget', active: false },
                  { label: 'Website', active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg px-3 py-1.5 text-xs ${
                      item.active ? 'bg-sage-50 text-sage-700 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Main content */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="text-sm font-medium text-gray-900">Welcome back</div>
              <div className="mt-1 text-xs text-gray-400">142 days until your wedding</div>
              {/* Stat cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Tasks done', value: '34/52', color: 'bg-sage-500' },
                  { label: 'Guests', value: '87', color: 'bg-wedding-500' },
                  { label: 'Budget left', value: '$8,420', color: 'bg-cream-600' },
                  { label: 'RSVPs', value: '64', color: 'bg-sage-400' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white p-3 shadow-sm">
                    <div className={`mb-1.5 h-1 w-6 rounded-full ${stat.color}`} />
                    <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
                    <div className="text-[10px] text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* Checklist preview */}
              <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
                <div className="mb-2 text-xs font-medium text-gray-700">Upcoming tasks</div>
                {[
                  { done: true, text: 'Book photographer' },
                  { done: true, text: 'Send save-the-dates' },
                  { done: false, text: 'Finalize guest list' },
                  { done: false, text: 'Schedule cake tasting' },
                ].map((task) => (
                  <div key={task.text} className="flex items-center gap-2 py-1">
                    <div
                      className={`h-3.5 w-3.5 rounded border ${
                        task.done ? 'border-sage-500 bg-sage-500' : 'border-gray-200 bg-white'
                      }`}
                    >
                      {task.done && (
                        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 text-white">
                          <path
                            d="M3.5 7L6 9.5L10.5 5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${
                        task.done ? 'text-gray-300 line-through' : 'text-gray-600'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface FeatureShowcaseProps {
  icon: LucideIcon
  label: string
  title: string
  description: string
  details: string[]
  direction: 'left' | 'right'
  accent: string
}

function FeatureShowcase({
  icon: Icon,
  label,
  title,
  description,
  details,
  direction,
  accent,
}: FeatureShowcaseProps) {
  const variants = direction === 'left' ? slideFromLeft : slideFromRight

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ...springSmooth }}
      className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16 ${
        direction === 'right' ? 'lg:flex-row-reverse' : ''
      }`}
    >
      <div className="flex-1">
        <div className={`relative overflow-hidden rounded-3xl ${accent} p-8 sm:p-12`}>
          <Icon className="h-16 w-16 text-white/90 sm:h-20 sm:w-20" strokeWidth={1.2} />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -top-4 right-12 h-16 w-16 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
          {label}
        </span>
        <h3 className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-gray-500">{description}</p>
        <ul className="mt-6 space-y-2.5">
          {details.map((detail) => (
            <li key={detail} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="bg-sage-400 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
              {detail}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const parallaxY = useParallax(80)

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFAF8]">
      <NavBar />

      {/* ─── Hero ─── */}
      <section className="relative px-5 pb-8 pt-32 sm:px-8 sm:pt-40 lg:pt-48">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            style={{ y: parallaxY }}
            className="bg-wedding-100/40 absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: parallaxY }}
            className="bg-sage-100/50 absolute -left-32 top-40 h-[400px] w-[400px] rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: parallaxY }}
            className="bg-cream-100/40 absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full blur-3xl"
          />
        </div>

        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ...springSmooth }}
            className="text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 text-sm font-medium tracking-wide text-gray-400"
            >
              For the two of you
            </motion.p>

            <motion.h1
              className="font-serif text-[2.75rem] leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Your <RotatingText />,
              <br />
              handled.
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              One place for your checklist, guest list, budget, and wedding website. Built for two
              people, not an entire industry.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-gray-900 px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/10 hover:bg-gray-800"
                >
                  <Link href="/sign-up">
                    Start planning — it&apos;s free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <Link
                href="/features"
                className="group text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                See what&apos;s included{' '}
                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Product preview */}
          <DashboardPreview />

          {/* Trust indicators */}
          <motion.div
            className="mx-auto mt-12 flex max-w-md flex-wrap items-center justify-center gap-x-8 gap-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Heart className="h-3 w-3" /> Free to start
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Sparkles className="h-3 w-3" /> No credit card needed
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckSquare className="h-3 w-3" /> No monthly fees
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── Separator ─── */}
      <div className="mx-auto max-w-xs px-5 py-20">
        <motion.div
          variants={drawLine}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="bg-sage-200 h-px w-full origin-left"
        />
      </div>

      {/* ─── Features ─── */}
      <section className="px-5 pb-24 sm:px-8 lg:pb-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-20 max-w-2xl"
          >
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              What you get
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you actually need.
              <br />
              Nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              We kept the feature list tight on purpose. No venue directories, no vendor
              marketplaces, no algorithm recommending you things to buy. Just the tools that help
              two people plan a wedding together.
            </p>
          </motion.div>

          <div className="space-y-24 lg:space-y-32">
            <FeatureShowcase
              icon={CheckSquare}
              label="Stay organized"
              title="A checklist that actually helps"
              description="50+ pre-built tasks from 'book the venue' to 'write your vows,' organized by timeline. Add your own, drag to reorder, attach files and notes."
              details={[
                'Pre-built templates you can customize',
                'Notes and file attachments per task',
                'Drag-and-drop prioritization',
                'Track progress across categories',
              ]}
              direction="left"
              accent="bg-sage-600"
            />
            <FeatureShowcase
              icon={Users}
              label="Guest list"
              title="Know who's coming"
              description="Import your spreadsheet, send RSVPs, track responses. Group by household, tag by table, filter by dietary needs."
              details={[
                'CSV import from any spreadsheet',
                'Real-time RSVP tracking',
                'Household grouping and plus-ones',
                'Tags for seating and meal planning',
              ]}
              direction="right"
              accent="bg-wedding-600"
            />
            <FeatureShowcase
              icon={DollarSign}
              label="Budget"
              title="See where every dollar goes"
              description="Set a total budget, break it into categories, and log expenses as you go. Upload receipts, track payment schedules, and export everything."
              details={[
                '23 pre-built budget categories',
                'Visual analytics and breakdowns',
                'Receipt uploads to cloud storage',
                'PDF and CSV export for your records',
              ]}
              direction="left"
              accent="bg-cream-700"
            />
            <FeatureShowcase
              icon={Globe}
              label="Wedding website"
              title="Your story, your way"
              description="Pick from 10 templates, add your photos and event details, share one link. Guests can RSVP, browse your registry, and leave guestbook messages."
              details={[
                '10 professionally designed templates',
                'Custom sections and photo galleries',
                'Built-in RSVP and guestbook',
                'Visitor analytics to see who checked in',
              ]}
              direction="right"
              accent="bg-sage-700"
            />
          </div>
        </div>
      </section>

      {/* ─── Value Props ─── */}
      <section className="bg-[#FFFCF7] px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-2xl"
          >
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              Why PlanForTwo
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              We built this differently.
            </h2>
          </motion.div>

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                title: 'Made for two people',
                body: 'Both partners get full access. No "planner vs. guest" hierarchy. You\'re equals.',
              },
              {
                title: 'Pay once, done',
                body: 'One payment unlocks every feature forever. No subscriptions, no renewal surprises.',
              },
              {
                title: 'No ads, no upsells',
                body: "We don't sell your data or show you ads. The product is the product.",
              },
              {
                title: 'Private by default',
                body: "Your guest list, budget, and details are yours. We don't share with vendors.",
              },
              {
                title: 'Works on everything',
                body: 'Plan on your phone at the florist, your laptop at home, or your tablet on the couch.',
              },
              {
                title: 'Real export options',
                body: "Download your data anytime — CSV, PDF, whatever you need. It's your wedding.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={revealUp}
                transition={{ duration: 0.6, ...springSmooth }}
                className="group rounded-2xl border border-gray-100 bg-white/80 p-7 transition-colors hover:border-gray-200 hover:bg-white"
              >
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing teaser ─── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sage-600 mb-3 inline-block text-xs font-semibold uppercase tracking-widest">
              Simple pricing
            </span>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Free to start. One upgrade if you want it all.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              The free plan gives you the checklist, 15 guests, and one website template. Ready for
              more? A single $200 payment unlocks everything — unlimited guests, all templates,
              budget tools, seating charts, and every feature we ever build.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-gray-900 px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/10 hover:bg-gray-800"
                >
                  <Link href="/sign-up">Start free</Link>
                </Button>
              </motion.div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl border-gray-200 px-8 text-sm"
              >
                <Link href="/features#pricing">Compare plans</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-gray-900 px-5 py-24 sm:px-8 lg:py-32">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your wedding deserves better than a spreadsheet.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-400">
            Start organizing everything in one place. Free account, no credit card, takes about 30
            seconds.
          </p>
          <motion.div className="mt-10" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-white px-8 text-sm font-medium text-gray-900 shadow-lg hover:bg-gray-100"
            >
              <Link href="/sign-up">
                Start planning together
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  )
}
