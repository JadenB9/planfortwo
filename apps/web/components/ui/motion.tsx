'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { type ReactNode } from 'react'
import {
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  scaleIn,
  staggerContainer,
  staggerGrid,
  listItem,
  pageTransition,
  springSmooth,
} from '@/lib/animations'

// Page wrapper with fade-in-up animation
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ...springSmooth }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered list container
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered grid container
export function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerGrid}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Individual stagger child item
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.4, ...springSmooth }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// List item with subtle slide
export function ListItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={listItem}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Fade in from below with optional delay
export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left'
}) {
  const variants = direction === 'down' ? fadeInDown : direction === 'left' ? fadeInLeft : fadeInUp
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5, delay, ...springSmooth }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scale in for cards, dialogs
export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay, ...springSmooth }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scroll-triggered reveal (for landing pages)
export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animated counter for numbers (e.g., dashboard stats)
export function AnimatedNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {value}
    </motion.span>
  )
}

// Hover scale for interactive elements
export function HoverScale({
  children,
  className,
  scale = 1.02,
}: {
  children: ReactNode
  className?: string
  scale?: number
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.04 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animate presence wrapper for conditional rendering
export function AnimatedPresence({ children }: { children: ReactNode }) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>
}
