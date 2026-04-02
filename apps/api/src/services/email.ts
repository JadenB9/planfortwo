import { Resend } from 'resend'
import { render } from '@react-email/components'
import {
  WelcomeEmail,
  PartnerInviteEmail,
  TeamMemberInviteEmail,
  RsvpInviteEmail,
} from '@planfortwo/email'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

const FROM_EMAIL = 'PlanForTwo <noreply@planfortwo.com>'

export const emailService = {
  async sendWelcome(email: string, firstName: string) {
    const resend = getResendClient()
    if (!resend) {
      console.warn('[email] RESEND_API_KEY not configured — skipping welcome email')

      return
    }

    const html = await render(WelcomeEmail({ firstName }))

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to PlanForTwo!',
      html,
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
      throw new Error(`Failed to send welcome email: ${error.message}`)
    }
  },

  async sendPartnerInvite(email: string, inviterName: string, inviteUrl: string) {
    const resend = getResendClient()
    if (!resend) {
      console.warn('[email] RESEND_API_KEY not configured — skipping partner invite email', {
        to: email.replace(/./g, '*'),
        subject: `${inviterName} invited you to plan your wedding on PlanForTwo`,
      })
      throw new Error('Email service is not configured. Please contact support or try again later.')
    }

    const html = await render(PartnerInviteEmail({ inviterName, inviteUrl }))

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} invited you to plan your wedding on PlanForTwo`,
      html,
    })

    if (error) {
      console.error('[email] Failed to send partner invite:', { to: maskEmail(email), error })
      throw new Error(`Failed to send invitation email: ${error.message}`)
    }
  },

  async sendTeamMemberInvite(
    email: string,
    inviterName: string,
    roleLabel: string,
    inviteUrl: string,
  ) {
    const resend = getResendClient()
    if (!resend) {
      console.warn('[email] RESEND_API_KEY not configured — skipping team member invite email', {
        to: email.replace(/./g, '*'),
        subject: `${inviterName} invited you to join their wedding planning team`,
      })
      throw new Error('Email service is not configured. Please contact support or try again later.')
    }

    const html = await render(TeamMemberInviteEmail({ inviterName, roleLabel, inviteUrl }))

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} invited you to join their wedding planning team`,
      html,
    })

    if (error) {
      console.error('[email] Failed to send team member invite:', { to: maskEmail(email), error })
      throw new Error(`Failed to send invitation email: ${error.message}`)
    }
  },

  async sendRsvpInvite(
    email: string,
    guestName: string,
    coupleName: string,
    weddingDate: string | null,
    venue: string | null,
    websiteUrl: string,
    rsvpDeadline: string | null,
  ) {
    const resend = getResendClient()
    if (!resend) {
      console.warn('[email] RESEND_API_KEY not configured — skipping RSVP invite email', {
        to: email.replace(/./g, '*'),
        subject: `You're invited to ${coupleName}'s wedding!`,
      })
      return
    }

    const html = await render(
      RsvpInviteEmail({ guestName, coupleName, weddingDate, venue, websiteUrl, rsvpDeadline }),
    )

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You're invited to ${coupleName}'s wedding!`,
      html,
    })

    if (error) {
      console.error('Failed to send RSVP invite email:', error)
      throw new Error(`Failed to send RSVP invite email: ${error.message}`)
    }
  },
}
