import { config } from 'dotenv'
config({ path: '../../.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema/index.js'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db = drizzle(client, { schema })

async function seed() {
  console.warn('Seeding database...')

  // Clear existing data
  await db.delete(schema.weddingMembers)
  await db.delete(schema.weddings)
  await db.delete(schema.users)

  // Create test users
  const [user1] = await db
    .insert(schema.users)
    .values({
      clerkId: 'clerk_test_user_1',
      email: 'emma@example.com',
      firstName: 'Emma',
      lastName: 'Johnson',
    })
    .returning()

  const [user2] = await db
    .insert(schema.users)
    .values({
      clerkId: 'clerk_test_user_2',
      email: 'james@example.com',
      firstName: 'James',
      lastName: 'Wilson',
    })
    .returning()

  if (!user1 || !user2) {
    throw new Error('Failed to create seed users')
  }

  // Create test wedding
  const [wedding] = await db
    .insert(schema.weddings)
    .values({
      name: 'Emma & James',
      date: new Date('2027-06-15T16:00:00Z'),
      venue: 'The Grand Estate',
      city: 'Charleston',
      state: 'SC',
      country: 'US',
      guestCountEstimate: 150,
      budgetTotal: '35000.00',
      style: 'elegant',
      timelineTemplate: '12-month',
      websiteSlug: 'emma-and-james',
      tier: 'full',
    })
    .returning()

  if (!wedding) {
    throw new Error('Failed to create seed wedding')
  }

  // Link users to wedding
  await db.insert(schema.weddingMembers).values([
    { weddingId: wedding.id, userId: user1.id, role: 'owner', joinedAt: new Date() },
    { weddingId: wedding.id, userId: user2.id, role: 'partner', joinedAt: new Date() },
  ])

  console.warn('Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
