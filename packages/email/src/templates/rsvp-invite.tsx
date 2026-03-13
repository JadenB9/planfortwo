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

interface RsvpInviteEmailProps {
  guestName: string
  coupleName: string
  weddingDate: string | null
  venue: string | null
  websiteUrl: string
  rsvpDeadline: string | null
}

export function RsvpInviteEmail({
  guestName,
  coupleName,
  weddingDate,
  venue,
  websiteUrl,
  rsvpDeadline,
}: RsvpInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to {coupleName}&apos;s wedding!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>You&apos;re Invited!</Heading>
          <Text style={text}>Dear {guestName},</Text>
          <Text style={text}>
            We are thrilled to invite you to celebrate our wedding
            {weddingDate ? ` on ${weddingDate}` : ''}
            {venue ? ` at ${venue}` : ''}.
          </Text>
          <Text style={text}>
            Please let us know if you can make it by responding to this invitation. You&apos;ll be
            able to note any dietary restrictions and let us know about your plus-one.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={websiteUrl}>
              View Our Wedding Website
            </Button>
          </Section>
          {rsvpDeadline && <Text style={deadlineText}>Please respond by {rsvpDeadline}</Text>}
          <Hr style={hr} />
          <Text style={footer}>
            This invitation was sent on behalf of {coupleName} via PlanForTwo.
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
  textAlign: 'center' as const,
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
  padding: '14px 36px',
}

const deadlineText = {
  fontSize: '14px',
  color: '#9a6b3a',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
}

const hr = {
  borderColor: '#e9bea5',
  margin: '24px 0',
}

const footer = {
  fontSize: '13px',
  color: '#9a9a9a',
}

export default RsvpInviteEmail
