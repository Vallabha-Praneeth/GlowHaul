import { expect, test } from '@playwright/test';

test('login shell renders core GlowHaul copy', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Run campaigns that move.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible();
});

test('magic link submission shows success state', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Work email').fill('operator.demo@glowhaul.local');
  await page.getByRole('button', { name: 'Send magic link' }).click();
  await expect(page.getByText('Magic link sent. Check your inbox to continue.')).toBeVisible();
});
