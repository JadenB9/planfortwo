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

interface PaymentReminderEmailProps {
  recipientName: string
  weddingName: string
  paymentTitle: string
  vendorName: string | null
  amount: string
  dueDate: string
  daysUntilDue: number
}

export function PaymentReminderEmail({
  recipientName,
  weddingName,
  paymentTitle,
  vendorName,
  amount,
  dueDate,
  daysUntilDue,
}: PaymentReminderEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount))

  const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const urgency = daysUntilDue <= 1 ? 'tomorrow' : `in ${daysUntilDue} days`

  return (
    <Html>
      <Head />
      <Preview>Payment reminder: {paymentTitle} due {urgency}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Payment Reminder</Heading>
          <Text style={text}>
            Hi {recipientName}, this is a friendly reminder about an upcoming payment
            for {weddingName}.
          </Text>
          <Section style={detailsBox}>
            <Text style={detailLabel}>Payment</Text>
            <Text style={detailValue}>{paymentTitle}</Text>
            {vendorName && (
              <>
                <Text style={detailLabel}>Vendor</Text>
                <Text style={detailValue}>{vendorName}</Text>
              </>
            )}
            <Text style={detailLabel}>Amount</Text>
            <Text style={detailValue}>{formattedAmount}</Text>
            <Text style={detailLabel}>Due Date</Text>
            <Text style={detailValue}>{formattedDate}</Text>
          </Section>
          <Text style={urgencyText}>
            This payment is due {urgency}. Please make sure it is taken care of on time!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            With love, The PlanForTwo Team
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

const detailsBox = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #e9bea5',
  margin: '16px 0',
}

const detailLabel = {
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#9a9a9a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 2px 0',
}

const detailValue = {
  fontSize: '16px',
  color: '#1a1a1a',
  fontWeight: '500' as const,
  margin: '0 0 12px 0',
}

const urgencyText = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#b45309',
  fontWeight: '500' as const,
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

export default PaymentReminderEmail
