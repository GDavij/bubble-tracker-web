import { test, expect } from '@playwright/test'

test('redirects unauthenticated user to login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/auth\/login/)
})
