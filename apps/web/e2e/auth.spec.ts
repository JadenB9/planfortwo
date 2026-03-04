import { test, expect } from '@playwright/test'

test.describe('Auth Pages', () => {
  test('sign-in page renders Clerk component', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveTitle(/Sign In/)
    // Clerk renders a div with their sign-in form
    await expect(page.locator('.cl-signIn-root, .cl-rootBox')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('sign-up page renders Clerk component', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page).toHaveTitle(/Sign Up/)
    await expect(page.locator('.cl-signUp-root, .cl-rootBox')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('unauthenticated user accessing /dashboard gets redirected to sign-in', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    // Clerk middleware should redirect to sign-in
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('unauthenticated user accessing /onboarding gets redirected to sign-in', async ({
    page,
  }) => {
    await page.goto('/onboarding')
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('/sign-in')
  })

  test('homepage is accessible without auth', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/PlanForTwo/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
