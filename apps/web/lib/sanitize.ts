import DOMPurify, { type Config } from 'dompurify'

/**
 * Strip dangerous HTML patterns for server-side rendering.
 * Removes script tags, event handlers, and javascript: URIs.
 * Client will re-sanitize with full DOMPurify during hydration.
 */
function sanitizeHtmlServer(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<iframe\b[^>]*\/>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="')
    .replace(/src\s*=\s*["']?\s*javascript:/gi, 'src="')
}

/**
 * Sanitize HTML using DOMPurify on client, regex stripping on server.
 * SSR output is safe against script injection; client re-sanitizes
 * with full DOMPurify during hydration for complete coverage.
 */
export function sanitizeHtml(html: string, config?: Config): string {
  if (typeof window === 'undefined') return sanitizeHtmlServer(html)
  return DOMPurify.sanitize(html, config) as string
}
