import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/handled/i)
  })

  it('renders the hero subtitle', () => {
    render(<HomePage />)
    expect(screen.getByText(/for the two of you/i)).toBeInTheDocument()
  })

  it('renders Start planning CTA links', () => {
    render(<HomePage />)
    const ctaLinks = screen.getAllByRole('link', { name: /start planning/i })
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1)
  })
})
