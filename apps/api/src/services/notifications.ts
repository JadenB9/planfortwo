import { eq, and, sql, inArray } from 'drizzle-orm'
import {
  db,
  songRequests,
  photos,
  guestbookEntries,
  prayers,
  emails,
  emailAddresses,
} from '@planfortwo/db'

export const notificationsService = {
  async getBadgeCounts(weddingId: string, userId: string) {
    // Inbox unread count
    const userAddresses = await db
      .select({ id: emailAddresses.id })
      .from(emailAddresses)
      .where(eq(emailAddresses.userId, userId))

    let inboxCount = 0
    if (userAddresses.length > 0) {
      const addressIds = userAddresses.map((a) => a.id)
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(emails)
        .where(
          and(
            inArray(emails.emailAddressId, addressIds),
            eq(emails.isRead, false),
            eq(emails.direction, 'inbound'),
          ),
        )
      inboxCount = result?.count ?? 0
    }

    // Pending song requests
    const [musicResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(songRequests)
      .where(and(eq(songRequests.weddingId, weddingId), eq(songRequests.isApproved, false)))
    const musicCount = musicResult?.count ?? 0

    // Pending photos
    const [photosResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(photos)
      .where(and(eq(photos.weddingId, weddingId), eq(photos.moderationStatus, 'pending')))
    const photosCount = photosResult?.count ?? 0

    // Pending guestbook messages
    const [messagesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(guestbookEntries)
      .where(and(eq(guestbookEntries.weddingId, weddingId), eq(guestbookEntries.isApproved, false)))
    const messagesCount = messagesResult?.count ?? 0

    // Pending prayers
    const [prayersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(prayers)
      .where(and(eq(prayers.weddingId, weddingId), eq(prayers.isApproved, false)))
    const prayersCount = prayersResult?.count ?? 0

    return {
      inbox: inboxCount,
      music: musicCount,
      photos: photosCount,
      messages: messagesCount,
      prayers: prayersCount,
    }
  },
}
