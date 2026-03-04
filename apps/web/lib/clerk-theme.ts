/**
 * Clerk appearance configuration for PlanForTwo.
 *
 * Uses the wedding palette (terracotta primary, cream background)
 * and the Inter font family to keep auth screens consistent
 * with the rest of the application.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#c2674a',
    colorBackground: '#fdf8f6',
    colorText: '#1f1f1f',
    colorInputBackground: '#ffffff',
    colorInputText: '#1f1f1f',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    card: {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      border: '1px solid #f0e6e0',
    },
    formButtonPrimary: {
      backgroundColor: '#c2674a',
      '&:hover': {
        backgroundColor: '#a8563e',
      },
    },
    footerActionLink: {
      color: '#c2674a',
      '&:hover': {
        color: '#a8563e',
      },
    },
  },
} as const
