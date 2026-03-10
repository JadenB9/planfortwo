import DOMPurify from 'isomorphic-dompurify'
import type { Config } from 'dompurify'

/**
 * Sanitize HTML using DOMPurify on both client and server.
 * isomorphic-dompurify handles environment detection automatically,
 * using jsdom on the server and the native DOM on the client.
 */
export function sanitizeHtml(html: string, config?: Config): string {
  return DOMPurify.sanitize(html, config) as string
}
