'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { staggerContainer, navItem, springSmooth } from '@/lib/animations'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', comingSoon: false },
  { href: '/checklist', label: 'Checklist', comingSoon: false },
  { href: '/guests', label: 'Guest List', comingSoon: false },
  { href: '/budget', label: 'Budget', comingSoon: false },
  { href: '/website', label: 'Website', comingSoon: false },
  { href: '/seating', label: 'Seating Chart', comingSoon: false },
  { href: '/vendors', label: 'Vendors', comingSoon: false },
  { href: '/events', label: 'Events', comingSoon: false },
  { href: '/photos', label: 'Photos', comingSoon: false },
  { href: '/registry', label: 'Registry', comingSoon: false },
  { href: '/ceremony', label: 'Ceremony', comingSoon: false },
  { href: '/music', label: 'Music', comingSoon: false },
  { href: '/honeymoon', label: 'Honeymoon', comingSoon: false },
  { href: '/communication', label: 'Communication', comingSoon: false },
  { href: '/settings', label: 'Settings', comingSoon: false },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="font-serif text-xl font-bold text-gray-900">
          Plan<span className="text-wedding-600">For</span>Two
        </Link>
      </div>

      <motion.nav
        className="mt-4 space-y-1 px-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <motion.div key={item.href} variants={navItem} transition={{ duration: 0.3, ...springSmooth }}>
              <Link
                href={item.comingSoon ? '#' : item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-wedding-50 text-wedding-700'
                    : item.comingSoon
                      ? 'cursor-default text-gray-400'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                <span>{item.label}</span>
                {item.comingSoon && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    Soon
                  </span>
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>
    </aside>
  )
}
