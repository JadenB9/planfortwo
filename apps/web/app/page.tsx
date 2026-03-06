'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  CheckSquare,
  Users,
  DollarSign,
  Globe,
  ArrowRight,
  Menu,
  X,
  Heart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  springSmooth,
  staggerSlow,
  revealUp,
  slideFromLeft,
  slideFromRight,
  drawLine,
} from '@/lib/animations'

function useParallax(offset: number = 50) {
  const { scrollYProgress } = useScroll()
  return useTransform(scrollYProgress, [0, 1], [0, -offset])
}

function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-5 py-2.5 shadow-sm backdrop-blur-lg">
          <Link href="/" className="font-serif text-lg font-bold tracking-tight text-gray-900">
            PlanForTwo
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-8 sm:flex">
            <Link
              href="/features"
              className="text-[13px] font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              Features
            </Link>
            <Link
              href="/features#pricing"
              className="text-[13px] font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/sign-in"
              className="text-[13px] font-medium tracking-wide text-gray-500 transition-colors hover:text-gray-900"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-gray-900 hover:bg-gray-800 rounded-lg px-4 text-xs font-medium text-white"
            >
              <Link href="/sign-up">Start planning</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-2 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg backdrop-blur-lg sm:hidden"
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/features"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Features
              </Link>
              <Link
                href="/features#pricing"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Pricing
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Sign in
              </Link>
              <Button
                asChild
                className="bg-gray-900 hover:bg-gray-800 mt-1 rounded-lg text-white"
              >
                <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                  Start planning
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
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
      {/* Visual side */}
      <div className="flex-1">
        <div
          className={`relative overflow-hidden rounded-3xl ${accent} p-8 sm:p-12`}
        >
          <Icon className="h-16 w-16 text-white/90 sm:h-20 sm:w-20" strokeWidth={1.2} />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -top-4 right-12 h-16 w-16 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Text side */}
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
      <section className="relative px-5 pb-20 pt-32 sm:px-8 sm:pt-40 lg:pt-48">
        {/* Warm organic background shapes */}
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
              className="font-serif text-[2.75rem] font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Plan your wedding,
              <br />
              <span className="text-wedding-600">not your stress.</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Checklists, guest lists, budgets, and your wedding website &mdash;
              all in one place. Built for two people, not an entire industry.
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
                  className="bg-gray-900 hover:bg-gray-800 rounded-xl px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/10"
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

          {/* Floating trust indicators */}
          <motion.div
            className="mx-auto mt-16 flex max-w-md flex-wrap items-center justify-center gap-x-8 gap-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
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

      {/* ─── Gentle separator ─── */}
      <div className="mx-auto max-w-xs px-5">
        <motion.div
          variants={drawLine}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="bg-sage-200 h-px w-full origin-left"
        />
      </div>

      {/* ─── "How it works" — Conversational, not grid ─── */}
      <section className="px-5 py-24 sm:px-8 lg:py-32">
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
              We kept the feature list tight on purpose. No venue directories, no
              vendor marketplaces, no algorithm recommending you things to buy.
              Just the tools that help two people plan a wedding together.
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

      {/* ─── Value Proposition — Asymmetric layout ─── */}
      <section className="bg-white px-5 py-24 sm:px-8 lg:py-32">
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
                body: 'We don\'t sell your data or show you ads. The product is the product.',
              },
              {
                title: 'Private by default',
                body: 'Your guest list, budget, and details are yours. We don\'t share with vendors.',
              },
              {
                title: 'Works on everything',
                body: 'Plan on your phone at the florist, your laptop at home, or your tablet on the couch.',
              },
              {
                title: 'Real export options',
                body: 'Download your data anytime — CSV, PDF, whatever you need. It\'s your wedding.',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={revealUp}
                transition={{ duration: 0.6, ...springSmooth }}
                className="group rounded-2xl border border-gray-100 bg-gray-50/50 p-7 transition-colors hover:border-gray-200 hover:bg-white"
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
              The free plan gives you the checklist, 15 guests, and one website template.
              Ready for more? A single $200 payment unlocks everything — unlimited guests,
              all templates, budget tools, seating charts, and every feature we ever build.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 rounded-xl px-8 text-sm font-medium text-white shadow-lg shadow-gray-900/10"
                >
                  <Link href="/sign-up">Start free</Link>
                </Button>
              </motion.div>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-gray-200 px-8 text-sm">
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
            Join PlanForTwo and start organizing everything in one place.
            Free account, no credit card, takes about 30 seconds.
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

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/" className="font-serif text-lg font-bold text-gray-900">
                PlanForTwo
              </Link>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
                Wedding planning software for couples who want simplicity over complexity.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Product
                </h4>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link href="/features" className="text-sm text-gray-500 hover:text-gray-900">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/features#pricing" className="text-sm text-gray-500 hover:text-gray-900">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="text-sm text-gray-500 hover:text-gray-900">
                      Get started
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Account
                </h4>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900">
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="text-sm text-gray-500 hover:text-gray-900">
                      Create account
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} PlanForTwo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
