import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/your wedding/i)
  })

  it('renders the tagline badge', () => {
    render(<HomePage />)
    expect(screen.getByText(/No subscriptions\. No ads\. Just planning\./i)).toBeInTheDocument()
  })

  it('renders Get Started Free CTA links', () => {
    render(<HomePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /Get Started/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
  })
})
