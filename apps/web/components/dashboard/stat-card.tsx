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
  const valueStr = String(value)
  const textClass =
    valueStr.length > 12
      ? 'text-lg font-bold text-foreground'
      : valueStr.length > 8
        ? 'text-xl font-bold text-foreground'
        : 'text-2xl font-bold text-foreground'

  const card = (
    <motion.div
      className="border-border bg-background flex h-full flex-col rounded-2xl border p-6 shadow-sm"
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
      <div className="mt-auto pt-4">
        <motion.p
          className={textClass}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {value}
        </motion.p>
        <p className="text-muted-foreground mt-1 text-sm">{label}</p>
      </div>
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    )
  }

  return card
}
