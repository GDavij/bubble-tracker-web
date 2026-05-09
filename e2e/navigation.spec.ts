import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'access_token', value: 'mock-token-for-testing', domain: 'localhost', path: '/' },
    ])
    await page.goto('/')
  })

  test('sidebar shows all main navigation items', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const navItems = [
      { name: /dashboard/i, icon: '📊' },
      { name: /social graph/i, icon: '🕸️' },
      { name: /people/i, icon: '👥' },
      { name: /relationships/i, icon: '🔗' },
      { name: /analyze/i, icon: '✍️' },
      { name: /chat/i, icon: '💬' },
      { name: /analytics/i, icon: '📋' },
    ]

    for (const item of navItems) {
      const link = page.getByRole('link', { name: item.name })
      await expect(link).toBeVisible()
    }
  })

  test('clicking analytics navigates to analytics page', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: /analytics/i }).first().click()
    await expect(page).toHaveURL(/\/analytics/)
  })

  test('clicking people navigates to people list', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: /people/i }).first().click()
    await expect(page).toHaveURL(/\/people/)
  })

  test('clicking dashboard navigates to dashboard', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: /dashboard/i }).first().click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('clicking graph navigates to social graph', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: /social graph|graph/i }).first().click()
    await expect(page).toHaveURL(/\/graph/)
  })
})
