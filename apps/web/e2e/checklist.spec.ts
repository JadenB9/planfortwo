import { test, expect } from '@playwright/test'

test.describe('Checklist Page', () => {
  test('redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/checklist')
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('checklist page loads with auth', async ({ page: _page }) => {
    // Requires Clerk test auth setup — placeholder for authenticated flow
    test.skip()
  })
})
