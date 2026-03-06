import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface PartnerInviteEmailProps {
  inviterName: string
  inviteUrl: string
}

export function PartnerInviteEmail({ inviterName, inviteUrl }: PartnerInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to plan your wedding together on PlanForTwo</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You have been invited!</Heading>
          <Text style={text}>
            {inviterName} has invited you to join them on PlanForTwo to plan your wedding together.
            Accept the invitation to start collaborating on your big day.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you did not expect this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#fdf8f6',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const heading = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  fontFamily: '"Playfair Display", Georgia, serif',
}

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4a4a4a',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#c2674a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const hr = {
  borderColor: '#e9bea5',
  margin: '24px 0',
}

const footer = {
  fontSize: '13px',
  color: '#9a9a9a',
}

export default PartnerInviteEmail
