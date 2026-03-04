import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  // Dashboard requires auth — unauthenticated users get redirected
  test('unauthenticated user is redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('/sign-in')
  })
})
