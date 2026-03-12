import { expect, test } from '@playwright/test';
import { hostedAuthFiles } from '../fixtures';

test.describe('hosted operator smoke', () => {
  test.use({ storageState: hostedAuthFiles.operator });

  test('operator dashboard loads seeded campaign state', async ({ page }) => {
    await page.goto('/operator');

    await expect(page.getByRole('heading', { name: /control room/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByTestId('operator-create-slot-form')).toBeVisible();
    await expect(page.getByTestId('operator-dispatch-board')).toBeVisible();
    await expect(page.getByTestId('operator-proof-review-queue')).toBeVisible();
    await expect(page.getByTestId('operator-incoming-offers-list')).toBeVisible();
    await expect(page.getByTestId('operator-accept-offer-submit').first()).toBeVisible();
  });
});

test.describe('hosted planner smoke', () => {
  test.use({ storageState: hostedAuthFiles.planner });

  test('planner marketplace shows execution and proof state', async ({ page }) => {
    await page.goto('/planner/search');

    await expect(page.getByRole('heading', { name: /search mobile inventory/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByTestId('planner-apply-filters-submit')).toBeVisible();
    await expect(page.getByTestId('planner-map-provider-label')).toBeVisible();
    await expect(page.getByTestId('planner-submitted-offers-list')).toBeVisible();
    await expect(page.getByTestId(/planner-submitted-offer-/).first()).toBeVisible();
  });
});

test.describe('hosted driver smoke', () => {
  test.use({ storageState: hostedAuthFiles.driver });

  test('driver workspace shows assigned run', async ({ page }) => {
    await page.goto('/driver');

    await expect(page.getByRole('heading', { name: /execute runs/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByText('Proof review pending')).toBeVisible();
    const firstRun = page.getByTestId(/driver-run-/).first();
    await expect(firstRun).toBeVisible();
    await expect(firstRun.getByTestId(/driver-action-en_route-/)).toBeVisible();
    await expect(firstRun.getByText(/Proof required before completion|Proof optional for this run/)).toBeVisible();
  });
});
