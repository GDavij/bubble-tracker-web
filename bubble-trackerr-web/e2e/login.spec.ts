import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('shows login form with all required fields', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByRole('heading', { name: /BubbleTracker/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /register|create account|sign up/i })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page.locator('text=/invalid|error|failed|incorrect/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('validates required fields', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('has link to registration page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: /register|create account|sign up/i }).click()
    await expect(page).toHaveURL(/\/auth\/register/)
  })
})
