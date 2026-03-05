import { Resend } from 'resend'
import { render } from '@react-email/components'
import { WelcomeEmail, PartnerInviteEmail } from '@planfortwo/email'

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

  async sendPartnerInvite(
    email: string,
    inviterName: string,
    inviteUrl: string,
  ) {
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
}
