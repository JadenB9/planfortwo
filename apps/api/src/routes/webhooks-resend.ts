import { Hono } from 'hono'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { inboxService } from '../services/inbox.js'
import { storageClient } from '@planfortwo/storage'
import { sanitizeHtml } from '../utils/sanitize.js'
import { db, emails } from '@planfortwo/db'
import { eq } from 'drizzle-orm'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

function parseEmailAddress(raw: string): { name?: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+)>$/)
  if (match) {
    return { name: match[1]!.trim(), email: match[2]!.trim() }
  }
  return { email: raw.trim() }
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
  console.log(`[resend-webhook] Received event: ${String(eventType).replace(/[\r\n\t]/g, '_')}`)

  if (eventType === 'email.received') {
    const data = payload.data as Record<string, unknown>
    const toAddresses = (data.to as string[]) ?? []
    const rawFrom = (data.from as string) ?? ''
    const subject = (data.subject as string) ?? '(No Subject)'
    const emailId = data.email_id as string
    const ccArray = (data.cc as string[]) ?? []
    const messageId = (data.message_id as string) ?? undefined
    const replyToArray = (data.reply_to as string[]) ?? []
    const replyTo = replyToArray.length > 0 ? replyToArray[0] : undefined

    const { name: fromName, email: fromAddress } = parseEmailAddress(rawFrom)

    for (const toAddr of toAddresses) {
      const localPart = toAddr.split('@')[0]?.toLowerCase()
      if (!localPart) continue

      const address = await inboxService.findAddressByLocalPart(localPart)
      if (!address) {
        console.log(
          `[resend-webhook] No claimed address found for ${localPart.replace(/[\r\n\t]/g, '_')}`,
        )
        continue
      }

      const resend = getResendClient()
      let textBody: string | undefined
      let htmlBody: string | undefined
      let attachmentsMeta: Array<{
        id: string
        filename: string
        contentType: string
        size: number
        url: string
        r2Key?: string
      }> = []

      if (resend && emailId) {
        // Fetch email content via Resend SDK
        try {
          const { data: emailContent, error: contentError } =
            await resend.emails.receiving.get(emailId)

          if (contentError) {
            console.error(
              `[resend-webhook] SDK error fetching email content: ${contentError.message}`,
            )
          } else if (emailContent) {
            textBody = emailContent.text ?? undefined
            htmlBody = emailContent.html ? sanitizeHtml(emailContent.html) : undefined
            console.log(
              `[resend-webhook] Fetched content: text=${textBody ? textBody.length : 0}chars, html=${htmlBody ? htmlBody.length : 0}chars`,
            )
          }
        } catch (err) {
          console.error('[resend-webhook] Exception fetching email content:', err)
        }

        // Fetch attachments via Resend SDK
        try {
          const { data: attData, error: attError } = await resend.emails.receiving.attachments.list(
            { emailId },
          )

          if (attError) {
            console.error(`[resend-webhook] SDK error fetching attachments: ${attError.message}`)
          } else if (attData?.data) {
            const rawAtts = attData.data as unknown as Array<Record<string, unknown>>
            attachmentsMeta = rawAtts
              .filter(
                (att) =>
                  typeof att.download_url === 'string' && att.download_url.startsWith('https://'),
              )
              .map((att) => ({
                id: crypto.randomUUID(),
                filename: String(att.filename ?? 'attachment').replace(/[^\x20-\x7E]/g, '_'),
                contentType: String(att.content_type ?? 'application/octet-stream'),
                size: Number(att.content_length ?? 0),
                url: String(att.download_url),
              }))
          }
        } catch (err) {
          console.error('[resend-webhook] Exception fetching attachments:', err)
        }

        // Persist attachments to R2 (Resend download URLs expire)
        for (const att of attachmentsMeta) {
          try {
            const r2Key = storageClient.buildEmailAttachmentKey(address.id, att.id, att.filename)
            await storageClient.uploadFromUrl(r2Key, att.url, att.contentType)
            att.r2Key = r2Key
          } catch (err) {
            console.error(`[resend-webhook] Failed to persist attachment ${att.filename}:`, err)
            // Keep the Resend URL as fallback
          }
        }
      } else {
        console.warn('[resend-webhook] RESEND_API_KEY not set, cannot fetch email content')
      }

      // Idempotency: skip if this Resend email was already stored
      if (emailId) {
        const [existing] = await db
          .select({ id: emails.id })
          .from(emails)
          .where(eq(emails.resendEmailId, emailId))
          .limit(1)
        if (existing) {
          console.log(`[resend-webhook] Duplicate email ${emailId} — skipping`)
          continue
        }
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
        replyTo,
        attachments: attachmentsMeta,
      })

      console.log(
        `[resend-webhook] Stored inbound email for ${localPart.replace(/[\r\n\t]/g, '_')} from ${fromAddress.replace(/[\r\n\t]/g, '_')}`,
      )
    }
  }

  return c.json({ received: true })
})
