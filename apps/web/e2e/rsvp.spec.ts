import { test, expect } from '@playwright/test'

test.describe('RSVP Public Pages', () => {
  test('RSVP entry page loads without auth', async ({ page }) => {
    await page.goto('/rsvp')
    // Public page should NOT redirect to sign-in
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/rsvp')
    expect(page.url()).not.toContain('/sign-in')
  })

  test('RSVP form page loads with token parameter', async ({ page }) => {
    await page.goto('/rsvp?token=test-token-abc')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/rsvp')
    expect(page.url()).toContain('token=test-token-abc')
  })
})
