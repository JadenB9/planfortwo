'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  trend?: string
  href?: string
}

export function StatCard({ label, value, icon, trend, href }: StatCardProps) {
  const card = (
    <motion.div
      className="rounded-2xl border border-gray-200 bg-white p-6"
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <motion.div
          className="bg-wedding-50 text-wedding-600 flex h-10 w-10 items-center justify-center rounded-xl"
          whileHover={{ rotate: 8, scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>
        {trend && <span className="text-sage-600 text-xs font-medium">{trend}</span>}
      </div>
      <motion.p
        className="mt-4 text-2xl font-bold text-gray-900"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {value}
      </motion.p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </motion.div>
  )

  if (href) {
    return <Link href={href}>{card}</Link>
  }

  return card
}
