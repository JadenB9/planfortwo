import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  firstName: string
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to PlanForTwo — let the planning begin!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {firstName}!</Heading>
          <Text style={text}>
            We are so excited you have chosen PlanForTwo to help plan your special day. Whether your
            wedding is months away or just around the corner, we have everything you need to make it
            unforgettable.
          </Text>
          <Hr style={hr} />
          <Section>
            <Text style={text}>Here is what you can do next:</Text>
            <Text style={listItem}>1. Complete your onboarding to personalize your experience</Text>
            <Text style={listItem}>2. Invite your partner to join the planning</Text>
            <Text style={listItem}>3. Start building your guest list</Text>
            <Text style={listItem}>4. Explore your planning checklist</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>With love, The PlanForTwo Team</Text>
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

const listItem = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4a4a4a',
  paddingLeft: '8px',
}

const hr = {
  borderColor: '#e9bea5',
  margin: '24px 0',
}

const footer = {
  fontSize: '14px',
  color: '#9a9a9a',
  fontStyle: 'italic' as const,
}

export default WelcomeEmail
