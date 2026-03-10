'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Is it really a one-time payment?',
    answer:
      'Yes! You pay $10 once and get lifetime access to every premium feature. No monthly fees, no hidden charges, no surprise upsells. Your wedding planning tools are yours for as long as you need them.',
  },
  {
    question: "What's included in the free plan?",
    answer:
      'The free plan includes full checklist editing, unlimited guests with RSVP tracking, complete budget tracking and analytics, vendor management, events, registry, ceremony and honeymoon planning, data export, and partner collaboration. Premium adds website customization, seating charts, inbox, music integration, photo gallery, and email campaigns.',
  },
  {
    question: 'Can I upgrade from free to full access later?',
    answer:
      'Absolutely. You can upgrade at any time and all of your existing data (guests, checklist items, budget entries) will carry over seamlessly. Nothing gets lost when you upgrade.',
  },
  {
    question: 'Is there a refund policy?',
    answer:
      'We offer a 30-day money-back guarantee. If PlanForTwo is not the right fit for your wedding planning needs, contact us within 30 days of purchase for a full refund, no questions asked.',
  },
  {
    question: 'Do you sell my data?',
    answer:
      'Never. Your wedding details, guest information, and personal data are yours alone. We do not sell, share, or monetize your data in any way. Our business model is simple: you pay once for the product, and that is it.',
  },
]

export function FaqSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`faq-${index}`}>
          <AccordionTrigger className="text-left text-base font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
