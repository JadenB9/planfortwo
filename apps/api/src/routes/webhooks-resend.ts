import { Hono } from 'hono'
import { Webhook } from 'svix'
import createDOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { inboxService } from '../services/inbox.js'

const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window as never)

const RESEND_API_BASE = 'https://api.resend.com'

async function fetchEmailContent(
  emailId: string,
  apiKey: string,
): Promise<{ text?: string; html?: string }> {
  try {
    const response = await fetch(`${RESEND_API_BASE}/emails/receiving`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_id: emailId }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`[resend-webhook] Failed to fetch email content: ${response.status} ${body}`)
      return {}
    }

    const data = (await response.json()) as Record<string, unknown>
    return {
      text: (data.text as string) ?? undefined,
      html: (data.html as string) ?? undefined,
    }
  } catch (err) {
    console.error('[resend-webhook] Error fetching email content:', err)
    return {}
  }
}

interface ResendAttachment {
  filename: string
  content_type: string
  content_length: number
  download_url: string
  expires_at: string
}

async function fetchEmailAttachments(emailId: string, apiKey: string): Promise<ResendAttachment[]> {
  try {
    const response = await fetch(
      `${RESEND_API_BASE}/emails/attachments?emailId=${encodeURIComponent(emailId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      const body = await response.text()
      console.error(`[resend-webhook] Failed to fetch attachments: ${response.status} ${body}`)
      return []
    }

    const result = (await response.json()) as { data: ResendAttachment[] }
    return result.data ?? []
  } catch (err) {
    console.error('[resend-webhook] Error fetching attachments:', err)
    return []
  }
}

function parseEmailAddress(raw: string): { name?: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+)>$/)
  if (match) {
    return { name: match[1]!.trim(), email: match[2]!.trim() }
  }
  return { email: raw.trim() }
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
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
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
      'sub',
      'sup',
      'small',
      'del',
      'ins',
      'mark',
      'abbr',
      'dl',
      'dt',
      'dd',
      'figure',
      'figcaption',
      'section',
      'header',
      'footer',
      'nav',
      'main',
      'article',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
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
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  })
}

export const resendWebhookRoute = new Hono()

resendWebhookRoute.post('/', async (c) => {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured')
    return c.json({ error: 'Webhook not configured' }, 500)
  }

  const svixId = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing signature headers' }, 400)
  }

  const rawBody = await c.req.text()

  let payload: Record<string, unknown>
  try {
    const wh = new Webhook(webhookSecret)
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as Record<string, unknown>
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const eventType = payload.type as string
  console.log(`[resend-webhook] Received event: ${eventType}`)

  if (eventType === 'email.received') {
    const data = payload.data as Record<string, unknown>
    const toAddresses = (data.to as string[]) ?? []
    const rawFrom = (data.from as string) ?? ''
    const subject = (data.subject as string) ?? '(No Subject)'
    const emailId = data.email_id as string
    const ccArray = (data.cc as string[]) ?? []
    const messageId = (data.message_id as string) ?? undefined

    const { name: fromName, email: fromAddress } = parseEmailAddress(rawFrom)

    for (const toAddr of toAddresses) {
      const localPart = toAddr.split('@')[0]?.toLowerCase()
      if (!localPart) continue

      const address = await inboxService.findAddressByLocalPart(localPart)
      if (!address) {
        console.log(`[resend-webhook] No claimed address found for ${localPart}`)
        continue
      }

      const resendApiKey = process.env.RESEND_API_KEY
      let textBody: string | undefined
      let htmlBody: string | undefined
      let attachmentsMeta: Array<{
        id: string
        filename: string
        contentType: string
        size: number
        url: string
      }> = []

      if (resendApiKey && emailId) {
        const content = await fetchEmailContent(emailId, resendApiKey)
        textBody = content.text
        htmlBody = content.html ? sanitizeHtml(content.html) : undefined

        const rawAttachments = await fetchEmailAttachments(emailId, resendApiKey)
        attachmentsMeta = rawAttachments.map((att) => ({
          id: crypto.randomUUID(),
          filename: att.filename,
          contentType: att.content_type,
          size: att.content_length,
          url: att.download_url,
        }))
      } else {
        console.warn('[resend-webhook] RESEND_API_KEY not set, cannot fetch email content')
      }

      await inboxService.storeInboundEmail(address.id, {
        resendEmailId: emailId,
        fromAddress,
        fromName,
        toAddress: toAddr,
        ccAddresses: ccArray.length > 0 ? ccArray.join(', ') : undefined,
        subject,
        textBody,
        htmlBody,
        messageId,
        attachments: attachmentsMeta,
      })

      console.log(`[resend-webhook] Stored inbound email for ${localPart} from ${fromAddress}`)
    }
  }

  return c.json({ received: true })
})
