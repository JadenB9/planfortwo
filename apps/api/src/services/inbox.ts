import { db, emailAddresses, emails } from '@planfortwo/db'
import { eq, and, desc, ilike, or, sql, count } from 'drizzle-orm'
import { Resend } from 'resend'
import type { InboxFiltersInput, UpdateEmailInput } from '@planfortwo/validators'

const RESERVED_ADDRESSES = ['admin', 'support', 'noreply', 'postmaster', 'abuse', 'webmaster']

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export const inboxService = {
  async listAddresses(userId: string) {
    return db.select().from(emailAddresses).where(eq(emailAddresses.userId, userId))
  },

  async claimAddress(userId: string, data: { address: string; displayName: string }) {
    const localPart = data.address.toLowerCase()

    if (RESERVED_ADDRESSES.includes(localPart)) {
      throw new Error('This address is reserved')
    }

    const existing = await db
      .select()
      .from(emailAddresses)
      .where(eq(emailAddresses.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      throw new Error('You already have a claimed email address')
    }

    const taken = await db
      .select()
      .from(emailAddresses)
      .where(eq(emailAddresses.address, localPart))
      .limit(1)

    if (taken.length > 0) {
      throw new Error('This address is already taken')
    }

    const [address] = await db
      .insert(emailAddresses)
      .values({
        userId,
        address: localPart,
        displayName: data.displayName,
      })
      .returning()

    return address
  },

  async checkAddressAvailability(address: string) {
    const localPart = address.toLowerCase()

    if (RESERVED_ADDRESSES.includes(localPart)) {
      return { available: false, reason: 'This address is reserved' }
    }

    const existing = await db
      .select()
      .from(emailAddresses)
      .where(eq(emailAddresses.address, localPart))
      .limit(1)

    return {
      available: existing.length === 0,
      reason: existing.length > 0 ? 'This address is already taken' : undefined,
    }
  },

  async listEmails(userId: string, filters: InboxFiltersInput) {
    const userAddresses = await db
      .select({ id: emailAddresses.id })
      .from(emailAddresses)
      .where(eq(emailAddresses.userId, userId))

    if (userAddresses.length === 0) {
      return { data: [], total: 0, page: filters.page, pageSize: filters.pageSize, hasMore: false }
    }

    const addressIds = userAddresses.map((a) => a.id)
    const conditions = [
      sql`${emails.emailAddressId} IN (${sql.join(
        addressIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    ]

    if (filters.emailAddressId) {
      if (!addressIds.includes(filters.emailAddressId)) {
        return {
          data: [],
          total: 0,
          page: filters.page,
          pageSize: filters.pageSize,
          hasMore: false,
        }
      }
      conditions.push(eq(emails.emailAddressId, filters.emailAddressId))
    }

    if (filters.direction) {
      conditions.push(eq(emails.direction, filters.direction))
    }

    if (filters.isRead !== undefined) {
      conditions.push(eq(emails.isRead, filters.isRead))
    }

    if (filters.isStarred !== undefined) {
      conditions.push(eq(emails.isStarred, filters.isStarred))
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(emails.subject, `%${filters.search}%`),
          ilike(emails.fromAddress, `%${filters.search}%`),
          ilike(emails.toAddress, `%${filters.search}%`),
        )!,
      )
    }

    const whereClause = and(...conditions)

    const [totalResult] = await db.select({ value: count() }).from(emails).where(whereClause)

    const total = totalResult?.value ?? 0
    const offset = (filters.page - 1) * filters.pageSize

    const rows = await db
      .select()
      .from(emails)
      .where(whereClause)
      .orderBy(desc(emails.createdAt))
      .limit(filters.pageSize)
      .offset(offset)

    return {
      data: rows,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: offset + rows.length < total,
    }
  },

  async getEmail(emailId: string, userId: string) {
    const result = await db
      .select()
      .from(emails)
      .innerJoin(emailAddresses, eq(emails.emailAddressId, emailAddresses.id))
      .where(and(eq(emails.id, emailId), eq(emailAddresses.userId, userId)))
      .limit(1)

    if (result.length === 0) return null

    const row = result[0]!
    if (!row.emails.isRead) {
      await db.update(emails).set({ isRead: true }).where(eq(emails.id, emailId))
    }

    return { ...row.emails, isRead: true }
  },

  async updateEmail(emailId: string, userId: string, data: UpdateEmailInput) {
    const result = await db
      .select({ emailId: emails.id })
      .from(emails)
      .innerJoin(emailAddresses, eq(emails.emailAddressId, emailAddresses.id))
      .where(and(eq(emails.id, emailId), eq(emailAddresses.userId, userId)))
      .limit(1)

    if (result.length === 0) return null

    const [updated] = await db.update(emails).set(data).where(eq(emails.id, emailId)).returning()

    return updated
  },

  async deleteEmail(emailId: string, userId: string) {
    const result = await db
      .select({ emailId: emails.id })
      .from(emails)
      .innerJoin(emailAddresses, eq(emails.emailAddressId, emailAddresses.id))
      .where(and(eq(emails.id, emailId), eq(emailAddresses.userId, userId)))
      .limit(1)

    if (result.length === 0) return false

    await db.delete(emails).where(eq(emails.id, emailId))
    return true
  },

  async sendEmail(
    userId: string,
    data: {
      emailAddressId: string
      toAddress: string
      subject: string
      textBody: string
      htmlBody?: string
    },
  ) {
    const [address] = await db
      .select()
      .from(emailAddresses)
      .where(and(eq(emailAddresses.id, data.emailAddressId), eq(emailAddresses.userId, userId)))
      .limit(1)

    if (!address) {
      throw new Error('Email address not found or not owned by you')
    }

    const fromEmail = `${address.displayName} <${address.address}@planfortwo.com>`
    const resend = getResendClient()

    if (!resend) {
      throw new Error('Email service not configured')
    }

    const sendPayload: {
      from: string
      to: string
      subject: string
      text: string
      html?: string
    } = {
      from: fromEmail,
      to: data.toAddress,
      subject: data.subject,
      text: data.textBody,
    }
    if (data.htmlBody) {
      sendPayload.html = data.htmlBody
    }

    const { data: sent, error } = await resend.emails.send(sendPayload)

    if (error) {
      console.error('[inbox] Resend send error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    const [email] = await db
      .insert(emails)
      .values({
        emailAddressId: data.emailAddressId,
        direction: 'outbound',
        resendEmailId: sent?.id ?? null,
        fromAddress: `${address.address}@planfortwo.com`,
        fromName: address.displayName,
        toAddress: data.toAddress,
        subject: data.subject,
        textBody: data.textBody,
        htmlBody: data.htmlBody ?? null,
        isRead: true,
      })
      .returning()

    return email
  },

  async getUnreadCount(userId: string) {
    const userAddresses = await db
      .select({ id: emailAddresses.id })
      .from(emailAddresses)
      .where(eq(emailAddresses.userId, userId))

    if (userAddresses.length === 0) return 0

    const addressIds = userAddresses.map((a) => a.id)

    const [result] = await db
      .select({ value: count() })
      .from(emails)
      .where(
        and(
          sql`${emails.emailAddressId} IN (${sql.join(
            addressIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          eq(emails.direction, 'inbound'),
          eq(emails.isRead, false),
        ),
      )

    return result?.value ?? 0
  },

  async storeInboundEmail(
    emailAddressId: string,
    data: {
      resendEmailId: string
      fromAddress: string
      fromName?: string
      toAddress: string
      ccAddresses?: string
      subject: string
      textBody?: string
      htmlBody?: string
      messageId?: string
    },
  ) {
    const [email] = await db
      .insert(emails)
      .values({
        emailAddressId,
        direction: 'inbound',
        resendEmailId: data.resendEmailId,
        fromAddress: data.fromAddress,
        fromName: data.fromName ?? null,
        toAddress: data.toAddress,
        ccAddresses: data.ccAddresses ?? null,
        subject: data.subject || '(No Subject)',
        textBody: data.textBody ?? null,
        htmlBody: data.htmlBody ?? null,
        messageId: data.messageId ?? null,
      })
      .returning()

    return email
  },

  async findAddressByLocalPart(localPart: string) {
    const [address] = await db
      .select()
      .from(emailAddresses)
      .where(eq(emailAddresses.address, localPart.toLowerCase()))
      .limit(1)

    return address ?? null
  },
}
