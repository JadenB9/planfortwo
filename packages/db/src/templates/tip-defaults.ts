export interface TipDefault {
  vendorType: string
  tipType: 'percent' | 'flat'
  min: number
  max: number
  suggested: number
  notes: string
}

export const tipDefaults: TipDefault[] = [
  {
    vendorType: 'Catering',
    tipType: 'percent',
    min: 15,
    max: 20,
    suggested: 18,
    notes: 'Of total food & beverage bill',
  },
  {
    vendorType: 'Bartenders',
    tipType: 'percent',
    min: 10,
    max: 15,
    suggested: 15,
    notes: 'Of bar bill, or $25-50 per bartender',
  },
  {
    vendorType: 'DJ / Band',
    tipType: 'flat',
    min: 50,
    max: 150,
    suggested: 100,
    notes: 'Per performer or 10-15% of fee',
  },
  {
    vendorType: 'Photographer',
    tipType: 'flat',
    min: 50,
    max: 200,
    suggested: 100,
    notes: 'Or 10-15% of total photography fee',
  },
  {
    vendorType: 'Videographer',
    tipType: 'flat',
    min: 50,
    max: 200,
    suggested: 100,
    notes: 'Or 10-15% of total videography fee',
  },
  {
    vendorType: 'Hair Stylist',
    tipType: 'percent',
    min: 15,
    max: 25,
    suggested: 20,
    notes: 'Per stylist, of their service cost',
  },
  {
    vendorType: 'Makeup Artist',
    tipType: 'percent',
    min: 15,
    max: 25,
    suggested: 20,
    notes: 'Per artist, of their service cost',
  },
  {
    vendorType: 'Transportation',
    tipType: 'percent',
    min: 15,
    max: 20,
    suggested: 18,
    notes: 'Per driver, of transportation cost',
  },
  {
    vendorType: 'Officiant',
    tipType: 'flat',
    min: 50,
    max: 100,
    suggested: 75,
    notes: 'Donation if religious officiant',
  },
  {
    vendorType: 'Florist',
    tipType: 'percent',
    min: 10,
    max: 15,
    suggested: 10,
    notes: 'Of total floral bill, especially for setup',
  },
  {
    vendorType: 'Delivery Staff',
    tipType: 'flat',
    min: 10,
    max: 25,
    suggested: 20,
    notes: 'Per delivery person',
  },
  { vendorType: 'Valet', tipType: 'flat', min: 1, max: 5, suggested: 2, notes: 'Per car parked' },
]
