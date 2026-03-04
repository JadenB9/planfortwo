import { test, expect } from '@playwright/test'

test.describe('Partner Invite Page', () => {
  test('invite page renders for unauthenticated user with sign-up option', async ({
    page,
  }) => {
    // /invite/:token is a public route
    await page.goto('/invite/test-token-abc123')

    await expect(page.getByRole('heading', { name: /invited/i })).toBeVisible()
    await expect(
      page.getByText(/someone special wants to plan their wedding/i)
    ).toBeVisible()

    // Unauthenticated users should see "Create Account" and "Sign In" links
    const createAccountLink = page.getByRole('link', {
      name: /create account/i,
    })
    await expect(createAccountLink).toBeVisible()
    await expect(createAccountLink).toHaveAttribute(
      'href',
      /\/sign-up\?redirect_url=.*invite.*test-token-abc123/
    )

    const signInLink = page.getByRole('link', { name: /sign in/i })
    await expect(signInLink).toBeVisible()
    await expect(signInLink).toHaveAttribute(
      'href',
      /\/sign-in\?redirect_url=.*invite.*test-token-abc123/
    )
  })
})
