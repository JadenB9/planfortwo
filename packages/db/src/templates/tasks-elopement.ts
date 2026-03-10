import type { TemplateTask } from './index'

export const tasksElopement: TemplateTask[] = [
  // ── 3 months before ──────────────────────────────────────────────
  {
    title: 'Set a simple budget',
    description:
      'Elopements are budget-friendly but still have costs: officiant, photographer, attire, travel, rings, and a celebratory meal. Write it all down.',
    categoryIndex: 7,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Choose your elopement location',
    description:
      'Pick a spot that means something to you — mountaintop, beach, courthouse, city hall, a favorite park, or a destination abroad. Check permit requirements for public spaces.',
    categoryIndex: 0,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Book your officiant',
    description:
      'Find a licensed officiant at your chosen location. Discuss ceremony format, personalization, and whether they can serve as a witness.',
    categoryIndex: 12,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Book an elopement photographer',
    description:
      'Look for photographers who specialize in elopements and adventure sessions. Discuss locations, timeline, and deliverables. Many also serve as a witness.',
    categoryIndex: 1,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Research marriage license requirements',
    description:
      'Every state and country has different rules. Check waiting periods, ID requirements, witness needs, and validity windows. Apply at the right time.',
    categoryIndex: 7,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Start shopping for your attire',
    description:
      'Elopement attire can be anything — a gown, cocktail dress, sharp suit, or something entirely your own. Buy off-the-rack for a short timeline.',
    categoryIndex: 4,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Book travel & accommodations',
    description:
      'If eloping away from home, book flights, hotels, or an Airbnb. Consider arriving a day early to explore and decompress.',
    categoryIndex: 6,
    monthsBefore: 3,
    priority: 'must_do',
  },
  {
    title: 'Decide who (if anyone) to invite',
    description:
      'Some couples elope alone, others bring parents or a few close friends. Decide what feels right and communicate your plans.',
    categoryIndex: 12,
    monthsBefore: 3,
    priority: 'must_do',
  },

  // ── 2 months before ──────────────────────────────────────────────
  {
    title: 'Buy wedding rings',
    description:
      'Select and size your rings. Allow time for engraving if desired. Simple bands often ship faster.',
    categoryIndex: 12,
    monthsBefore: 2,
    priority: 'must_do',
  },
  {
    title: 'Write your personal vows',
    description:
      'This is the heart of your elopement. Take time to write something meaningful, authentic, and from the heart. Agree on a similar length.',
    categoryIndex: 12,
    monthsBefore: 2,
    priority: 'must_do',
  },
  {
    title: 'Plan your elopement day timeline',
    description:
      "Map the day: getting ready, first look, ceremony, photos, and a celebratory meal. Keep it relaxed — that's the whole point.",
    categoryIndex: 6,
    monthsBefore: 2,
    priority: 'must_do',
  },
  {
    title: 'Order a small bouquet & boutonniere',
    description:
      'Contact a local florist at your destination or order dried flowers that travel well. Simple and beautiful.',
    categoryIndex: 2,
    monthsBefore: 2,
    priority: 'nice_to_have',
  },
  {
    title: 'Book a celebratory dinner',
    description:
      'Reserve a table at a special restaurant for your post-ceremony celebration. Ask about a private area or outdoor seating.',
    categoryIndex: 0,
    monthsBefore: 2,
    priority: 'nice_to_have',
  },
  {
    title: 'Plan your elopement hair & makeup',
    description:
      'Book a stylist at your destination or plan to do your own. Do a practice run at home either way.',
    categoryIndex: 4,
    monthsBefore: 2,
    priority: 'nice_to_have',
  },

  // ── 1 month before ───────────────────────────────────────────────
  {
    title: 'Apply for your marriage license',
    description:
      "Time this based on your location's validity window (usually 30-90 days). Bring required ID and documentation.",
    categoryIndex: 7,
    monthsBefore: 1,
    priority: 'must_do',
  },
  {
    title: 'Confirm all vendor details',
    description:
      'Reconfirm your officiant, photographer, and any other vendors. Share your timeline, meeting locations, and phone numbers.',
    categoryIndex: 6,
    monthsBefore: 1,
    priority: 'must_do',
  },
  {
    title: 'Finalize & practice your vows',
    description:
      'Polish your vows and read them aloud several times. Print a clean copy on nice card stock to hold during the ceremony.',
    categoryIndex: 12,
    monthsBefore: 1,
    priority: 'must_do',
  },
  {
    title: 'Get your attire fitted & ready',
    description:
      'Do a final try-on with all accessories and shoes. Steam or press everything and pack it carefully for travel.',
    categoryIndex: 4,
    monthsBefore: 1,
    priority: 'must_do',
  },

  // ── Elopement week (0 months before) ─────────────────────────────
  {
    title: 'Pack rings, vows, license & attire',
    description:
      'Use a checklist. Carry rings, vows, and license in your personal bag — never in checked luggage. Bring an emergency kit with snacks and a phone charger.',
    categoryIndex: 7,
    monthsBefore: 0,
    priority: 'must_do',
  },
  {
    title: 'Enjoy your elopement day',
    description:
      'Be fully present with each other. No guest list to manage, no timeline pressure — just the two of you making a promise.',
    categoryIndex: 12,
    monthsBefore: 0,
    priority: 'must_do',
  },
  {
    title: 'File your marriage certificate',
    description:
      'Confirm your officiant filed the signed certificate after the ceremony. Order extra certified copies for name changes and legal matters.',
    categoryIndex: 7,
    monthsBefore: 0,
    priority: 'must_do',
  },
]
