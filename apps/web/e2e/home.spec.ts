import { test, expect } from '@playwright/test'

test('homepage loads with title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/PlanForTwo/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('CTA link exists', async ({ page }) => {
  await page.goto('/')
  const cta = page.getByRole('link', { name: /Get Started Free/i })
  await expect(cta).toBeVisible()
  await expect(cta).toHaveAttribute('href', '/sign-up')
})
