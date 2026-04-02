import { test, expect } from '@playwright/test'

test.describe('Guest List Page', () => {
  test('redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/guests')
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('guest list page loads with auth', async ({ page: _page }) => {
    // Requires Clerk test auth setup — placeholder for authenticated flow
    test.skip()
  })

  test('add guest button visible when authenticated', async ({ page: _page }) => {
    // Requires Clerk test auth setup — placeholder for authenticated flow
    test.skip()
  })
})
