import { test, expect } from '@playwright/test'

test.describe('Budget Page', () => {
  test('redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/budget')
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('budget page loads with auth', async ({ page }) => {
    // Requires Clerk test auth setup — placeholder for authenticated flow
    test.skip()
  })

  test('shows upgrade prompt for free tier', async ({ page }) => {
    // Requires Clerk test auth with free-tier wedding — placeholder
    test.skip()
  })

  test('displays budget overview stats', async ({ page }) => {
    // Requires seeded budget data — placeholder for authenticated flow
    test.skip()
  })

  test('shows expense table', async ({ page }) => {
    // Requires seeded budget items — placeholder for authenticated flow
    test.skip()
  })
})
