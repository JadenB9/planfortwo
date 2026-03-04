import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PlanForTwo')
  })

  it('renders the tagline', () => {
    render(<HomePage />)
    expect(screen.getByText(/Pay once, plan your wedding/i)).toBeInTheDocument()
  })

  it('renders the CTA button', () => {
    render(<HomePage />)
    expect(screen.getByRole('link', { name: /Get Started Free/i })).toHaveAttribute(
      'href',
      '/sign-up',
    )
  })
})
