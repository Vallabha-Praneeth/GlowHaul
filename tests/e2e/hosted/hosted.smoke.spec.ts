import { expect, test } from '@playwright/test';
import { hostedAuthFiles } from '../fixtures';

test.describe('hosted operator smoke', () => {
  test.use({ storageState: hostedAuthFiles.operator });

  test('operator dashboard loads seeded campaign state', async ({ page }) => {
    await page.goto('/operator');

    await expect(page.getByText('Olivia Operator')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Texas fleet, one control room.' })).toBeVisible();
    await expect(page.getByText('Hosted smoke accepted offer')).toBeVisible();
    await expect(page.getByText('1 offer waiting')).toBeVisible();
  });
});

test.describe('hosted planner smoke', () => {
  test.use({ storageState: hostedAuthFiles.planner });

  test('planner marketplace shows execution and proof state', async ({ page }) => {
    await page.goto('/planner/search');

    await expect(page.getByText('Parker Planner')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Search mobile inventory fast.' })).toBeVisible();
    await expect(page.getByText('Execution:')).toBeVisible();
    await expect(page.getByText('Uploaded • 1 proof logged')).toBeVisible();
  });
});

test.describe('hosted driver smoke', () => {
  test.use({ storageState: hostedAuthFiles.driver });

  test('driver workspace shows assigned run', async ({ page }) => {
    await page.goto('/driver');

    await expect(page.getByText('Drew Driver', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Execute runs without call-chain chaos.' })).toBeVisible();
    await expect(page.getByText('Proof review pending')).toBeVisible();
    await expect(page.getByTestId('driver-action-en_route')).toBeVisible();
  });
});
