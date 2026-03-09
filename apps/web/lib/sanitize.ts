import DOMPurify, { type Config } from 'dompurify'

/**
 * Sanitize HTML using DOMPurify, with SSR safety.
 * During server-side rendering (no window), returns the raw HTML —
 * the client will re-sanitize during hydration.
 */
export function sanitizeHtml(html: string, config?: Config): string {
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, config) as string
}
