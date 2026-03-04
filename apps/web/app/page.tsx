'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { springSmooth } from '@/lib/animations'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ...springSmooth }}
      >
        <motion.h1
          className="font-serif text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Plan<span className="text-wedding-600">For</span>Two
        </motion.h1>
        <motion.p
          className="mt-6 text-lg leading-8 text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Pay once, plan your wedding without ads or upsells. Everything you need from engagement to
          &ldquo;I do.&rdquo;
        </motion.p>
        <motion.div
          className="mt-10 flex items-center justify-center gap-x-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/sign-up"
              className="rounded-xl bg-wedding-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wedding-600"
            >
              Get Started Free
            </Link>
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
    </main>
  )
}
