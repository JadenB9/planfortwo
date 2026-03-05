'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Users,
  DollarSign,
  Globe,
  Heart,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations'
import { Button } from '@/components/ui/button'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: CheckSquare,
    title: 'Smart Checklists',
    description:
      'Pre-built templates with 50+ tasks. Customize, prioritize, and track progress from engagement to the big day.',
  },
  {
    icon: Users,
    title: 'Guest Management',
    description:
      'Unlimited guests, RSVP tracking, dietary needs, household grouping, and CSV import/export.',
  },
  {
    icon: DollarSign,
    title: 'Budget Tracker',
    description:
      'Detailed expense tracking, visual analytics, receipt uploads, and payment schedule reminders.',
  },
  {
    icon: Globe,
    title: 'Wedding Website',
    description:
      '10 professionally designed templates with custom domains, photo galleries, and built-in analytics.',
  },
]

const highlights = [
  {
    icon: Heart,
    title: 'Built for Couples',
    description: 'Designed for two people planning together, not a wedding industry machine.',
  },
  {
    icon: Shield,
    title: 'Pay Once, Plan Forever',
    description: 'No subscriptions, no ads, no upsells. One payment unlocks everything.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-sage-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="font-serif text-xl font-bold text-gray-900">
            PlanForTwo
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Features
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign In
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

      {/* Hero Section */}
      <section className="relative px-4 pb-24 pt-28 sm:px-6 sm:pt-36 lg:px-8 lg:pt-44">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cream-50 via-white to-sage-50/30" />
        {/* Decorative background image */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <Image
            src="/images/hero-wedding.svg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ...springSmooth }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white/80 px-4 py-1.5 text-sm text-sage-700 backdrop-blur-sm"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage-500" />
              No subscriptions. No ads. Just planning.
            </motion.div>

            <motion.h1
              className="font-serif text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Your wedding,{' '}
              <span className="text-wedding-600">planned together</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              The all-in-one wedding planner built for couples who want simplicity
              over complexity. Pay once, plan your entire wedding without ads or
              upsells.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-wedding-600 px-8 text-base text-white shadow-md hover:bg-wedding-700"
                >
                  <Link href="/dashboard">Get Started Free</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                <Link
                  href="/features"
                  className="text-sm font-semibold leading-6 text-gray-900 transition-colors hover:text-wedding-600"
                >
                  See Features <span aria-hidden="true">&rarr;</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Feature illustration cards row */}
          <motion.div
            className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { src: '/images/couple-planning.svg', label: 'Plan Together' },
              { src: '/images/venue.svg', label: 'Find Venues' },
              { src: '/images/flowers.svg', label: 'Every Detail' },
              { src: '/images/table-setting.svg', label: 'Reception Ready' },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeInUp}
                transition={{ duration: 0.5, ...springSmooth }}
                className="group overflow-hidden rounded-xl border border-sage-100 bg-white/60 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="px-3 py-2.5 text-center text-xs font-medium text-gray-600">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Four powerful tools that cover every aspect of wedding planning,
              designed to work together seamlessly.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group rounded-2xl border border-sage-100 bg-gradient-to-br from-white to-cream-50/50 p-8 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage-100 transition-colors group-hover:bg-sage-200">
                      <Icon className="h-6 w-6 text-sage-700" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Highlights Section */}
      <section className="bg-gradient-to-b from-sage-50/40 to-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why couples choose PlanForTwo
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Join thousands of couples who picked a simpler, more honest way to plan
              their wedding.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {highlights.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="rounded-2xl border border-wedding-100 bg-white p-8 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wedding-50">
                    <Icon className="h-7 w-7 text-wedding-600" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {item.description}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Stats row */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-8 rounded-2xl border border-sage-100 bg-white p-8 text-center shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {[
              { stat: '10', label: 'Website Templates' },
              { stat: '50+', label: 'Checklist Tasks' },
              { stat: '$0', label: 'Monthly Fees' },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-serif text-3xl font-bold text-wedding-600 sm:text-4xl">
                  {item.stat}
                </p>
                <p className="mt-1 text-sm text-gray-500">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-white to-cream-50 px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-8 flex justify-center">
            <Image
              src="/images/rings.svg"
              alt="Wedding rings"
              width={120}
              height={90}
              className="opacity-60"
            />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to start planning?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Create your free account and start building your perfect wedding day,
            together.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-wedding-600 px-8 text-base text-white shadow-md hover:bg-wedding-700"
              >
                <Link href="/sign-up">Get Started Free</Link>
              </Button>
            </motion.div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl px-8"
            >
              <Link href="/features">View All Features</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            Free plan includes checklist, 15 guests, and 1 website template.
            Upgrade anytime for full access.
          </p>
        </motion.div>
      </section>
    </main>
  )
}
