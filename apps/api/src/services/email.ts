import { Resend } from 'resend'
import { render } from '@react-email/components'
import { WelcomeEmail, PartnerInviteEmail } from '@planfortwo/email'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }
  return new Resend(apiKey)
}

const FROM_EMAIL = 'PlanForTwo <noreply@planfortwo.com>'

export const emailService = {
  async sendWelcome(email: string, firstName: string) {
    const resend = getResendClient()
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
