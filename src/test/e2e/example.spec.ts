import { test, expect } from '@playwright/test';

test('homepage loads with correct title', async ({ page }) => {
  await page.goto('/');

  // Check page title
  await expect(page).toHaveTitle(/ESS Financial/);
  
  // Check h1 contains app name
  await expect(page.locator('h1')).toContainText('ESS Financial');
});

test('displays login form', async ({ page }) => {
  await page.goto('/');

  // Check login form elements exist
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
});
