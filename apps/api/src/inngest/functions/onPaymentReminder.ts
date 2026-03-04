import { inngest } from '../client.js'
import { db, paymentSchedule, budgetItems, weddings, users, weddingMembers } from '@planfortwo/db'
import { eq, and, lte, sql } from 'drizzle-orm'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { PaymentReminderEmail } from '@planfortwo/email'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export const onPaymentReminder = inngest.createFunction(
  { id: 'payment-reminder', name: 'Send Payment Reminders' },
  { cron: '0 9 * * *' },
  async ({ step }) => {
    const now = new Date()
    const oneDayOut = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcoming7d = await step.run('fetch-7d-reminders', async () => {
      return db
        .select({
          scheduleId: paymentSchedule.id,
          title: paymentSchedule.title,
          amount: paymentSchedule.amount,
          dueDate: paymentSchedule.dueDate,
          weddingId: paymentSchedule.weddingId,
          itemDescription: budgetItems.description,
          vendorName: budgetItems.vendorName,
        })
        .from(paymentSchedule)
        .innerJoin(budgetItems, eq(paymentSchedule.budgetItemId, budgetItems.id))
        .where(
          and(
            eq(paymentSchedule.isPaid, false),
            eq(paymentSchedule.reminderSent7d, false),
            lte(paymentSchedule.dueDate, sevenDaysOut),
          ),
        )
    })

    for (const payment of upcoming7d) {
      await step.run(`send-7d-${payment.scheduleId}`, async () => {
        const members = await db
          .select({ email: users.email, firstName: users.firstName })
          .from(weddingMembers)
          .innerJoin(users, eq(weddingMembers.userId, users.id))
          .where(eq(weddingMembers.weddingId, payment.weddingId))

        const [wedding] = await db
          .select({ name: weddings.name })
          .from(weddings)
          .where(eq(weddings.id, payment.weddingId))

        for (const member of members) {
          const html = await render(PaymentReminderEmail({
            recipientName: member.firstName,
            weddingName: wedding?.name ?? 'Your Wedding',
            paymentTitle: payment.title,
            vendorName: payment.vendorName,
            amount: payment.amount,
            dueDate: String(payment.dueDate),
            daysUntilDue: 7,
          }))

          await getResend().emails.send({
            from: process.env.EMAIL_FROM ?? 'PlanForTwo <noreply@planfortwo.com>',
            to: member.email,
            subject: `Payment reminder: ${payment.title} due in 7 days`,
            html,
          })
        }

        await db
          .update(paymentSchedule)
          .set({ reminderSent7d: true })
          .where(eq(paymentSchedule.id, payment.scheduleId))
      })
    }

    const upcoming1d = await step.run('fetch-1d-reminders', async () => {
      return db
        .select({
          scheduleId: paymentSchedule.id,
          title: paymentSchedule.title,
          amount: paymentSchedule.amount,
          dueDate: paymentSchedule.dueDate,
          weddingId: paymentSchedule.weddingId,
          itemDescription: budgetItems.description,
          vendorName: budgetItems.vendorName,
        })
        .from(paymentSchedule)
        .innerJoin(budgetItems, eq(paymentSchedule.budgetItemId, budgetItems.id))
        .where(
          and(
            eq(paymentSchedule.isPaid, false),
            eq(paymentSchedule.reminderSent1d, false),
            lte(paymentSchedule.dueDate, oneDayOut),
          ),
        )
    })

    for (const payment of upcoming1d) {
      await step.run(`send-1d-${payment.scheduleId}`, async () => {
        const members = await db
          .select({ email: users.email, firstName: users.firstName })
          .from(weddingMembers)
          .innerJoin(users, eq(weddingMembers.userId, users.id))
          .where(eq(weddingMembers.weddingId, payment.weddingId))

        const [wedding] = await db
          .select({ name: weddings.name })
          .from(weddings)
          .where(eq(weddings.id, payment.weddingId))

        for (const member of members) {
          const html = await render(PaymentReminderEmail({
            recipientName: member.firstName,
            weddingName: wedding?.name ?? 'Your Wedding',
            paymentTitle: payment.title,
            vendorName: payment.vendorName,
            amount: payment.amount,
            dueDate: String(payment.dueDate),
            daysUntilDue: 1,
          }))

          await getResend().emails.send({
            from: process.env.EMAIL_FROM ?? 'PlanForTwo <noreply@planfortwo.com>',
            to: member.email,
            subject: `Payment due tomorrow: ${payment.title}`,
            html,
          })
        }

        await db
          .update(paymentSchedule)
          .set({ reminderSent1d: true })
          .where(eq(paymentSchedule.id, payment.scheduleId))
      })
    }

    return { sent7d: upcoming7d.length, sent1d: upcoming1d.length }
  },
)
