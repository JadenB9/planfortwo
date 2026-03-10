import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window as never)

const ALLOWED_TAGS = [
  // Structural
  'html',
  'head',
  'body',
  'style',
  // Text
  'a',
  'b',
  'i',
  'u',
  'em',
  'strong',
  'p',
  'br',
  'div',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Lists
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  // Tables (critical for email layout)
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  // Media
  'img',
  'picture',
  'source',
  'video',
  // Formatting
  'hr',
  'sub',
  'sup',
  'small',
  'del',
  'ins',
  'mark',
  'abbr',
  'blockquote',
  'pre',
  'code',
  // Semantic
  'section',
  'header',
  'footer',
  'nav',
  'main',
  'article',
  'figure',
  'figcaption',
  // Legacy email elements (many emails still use these)
  'center',
  'font',
]

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'style',
  'target',
  'rel',
  'width',
  'height',
  'colspan',
  'rowspan',
  'cellpadding',
  'cellspacing',
  'border',
  'align',
  'valign',
  'bgcolor',
  'color',
  'face',
  'size',
  'role',
  'aria-label',
  'aria-hidden',
  'dir',
  'lang',
  'type',
  'media',
]

/**
 * Sanitize HTML using a shared DOMPurify instance with a unified allowlist.
 * Used for both inbound email processing and outbound email sanitization.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    WHOLE_DOCUMENT: true,
  })
}
