import { Resend } from 'resend'
import { render } from '@react-email/components'
import {
  WelcomeEmail,
  PartnerInviteEmail,
  TeamMemberInviteEmail,
  RsvpInviteEmail,
} from '@planfortwo/email'

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
      console.warn('[email] RESEND_API_KEY not configured — skipping welcome email', {
        to: email,
        subject: 'Welcome to PlanForTwo!',
      })
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
        to: email,
        subject: `${inviterName} invited you to plan your wedding on PlanForTwo`,
        inviteUrl,
      })
      return
    }

    const html = await render(PartnerInviteEmail({ inviterName, inviteUrl }))

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} invited you to plan your wedding on PlanForTwo`,
      html,
    })

    if (error) {
      console.error('Failed to send partner invite email:', error)
      throw new Error(`Failed to send partner invite email: ${error.message}`)
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
        to: email,
        subject: `${inviterName} invited you to join their wedding planning team`,
        inviteUrl,
      })
      return
    }

    const html = await render(TeamMemberInviteEmail({ inviterName, roleLabel, inviteUrl }))

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} invited you to join their wedding planning team`,
      html,
    })

    if (error) {
      console.error('Failed to send team member invite email:', error)
      throw new Error(`Failed to send team member invite email: ${error.message}`)
    }
  },

  async sendRsvpInvite(
    email: string,
    guestName: string,
    coupleName: string,
    weddingDate: string | null,
    venue: string | null,
    rsvpUrl: string,
    rsvpDeadline: string | null,
  ) {
    const resend = getResendClient()
    if (!resend) {
      console.warn('[email] RESEND_API_KEY not configured — skipping RSVP invite email', {
        to: email,
        subject: `You're invited to ${coupleName}'s wedding!`,
        rsvpUrl,
      })
      return
    }

    const html = await render(
      RsvpInviteEmail({ guestName, coupleName, weddingDate, venue, rsvpUrl, rsvpDeadline }),
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
