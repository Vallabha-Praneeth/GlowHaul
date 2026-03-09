import { expect, test } from '../fixtures';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'planner', storageState: authFiles.planner });

test('planner marketplace exposes free-first map strategy and filter controls', async ({ browser, page, gotoRoleHome }) => {
  const slotNote = `Planner filter slot ${Date.now()}`;
  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();

  try {
    await operatorPage.goto(roleHomePaths.operator);
    const createForm = operatorPage.getByTestId('operator-create-slot-form');
    await createForm.getByLabel('Region').selectOption('Houston');
    await createForm.getByLabel('Rate (USD)').fill('4100');
    await createForm.getByLabel('Campaign notes').fill(slotNote);
    await createForm.getByRole('button', { name: 'Create slot' }).click();
    await expect(operatorPage.getByText('Slot inventory created.')).toBeVisible();

    await gotoRoleHome();
    await expect(page.getByText('Map provider: MapLibre-ready')).toBeVisible();
    await expect(page.getByTestId('live-sync-badge')).toBeVisible();
    await page.getByLabel('Search').fill(slotNote);
    await page.getByLabel('Region').selectOption('Houston');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.getByText(slotNote)).toBeVisible();
    await expect(page.getByText('Visible slots: 1')).toBeVisible();
  } finally {
    await operatorContext.close();
  }
});

test('planner offer can be submitted and later shows confirmed booking state via live refresh', async ({ browser, page }) => {
  const slotNote = `Planner flow slot ${Date.now()}`;
  const offerMessage = `Planner offer ${Date.now()}`;
  const campaignName = `Planner booking ${Date.now()}`;

  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();

  try {
    await operatorPage.goto(roleHomePaths.operator);
    const createForm = operatorPage.getByTestId('operator-create-slot-form');
    await createForm.getByLabel('Region').selectOption('Houston');
    await createForm.getByLabel('Rate (USD)').fill('3300');
    await createForm.getByLabel('Campaign notes').fill(slotNote);
    await createForm.getByRole('button', { name: 'Create slot' }).click();
    await expect(operatorPage.getByText('Slot inventory created.')).toBeVisible();

    await page.goto(roleHomePaths.planner);
    await expect(page.getByText('Map provider: MapLibre-ready')).toBeVisible();

    const marketplaceCard = page.locator('div.surface').filter({ hasText: slotNote }).first();
    await marketplaceCard.getByLabel('Offer amount (USD)').fill('3450');
    await marketplaceCard.getByLabel('Offer note').fill(offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();

    await expect(page.getByText('Offer submitted to the operator.')).toBeVisible();
    await expect(page.getByText(offerMessage)).toBeVisible();

    await operatorPage.goto(roleHomePaths.operator);
    const incomingOfferCard = operatorPage.locator('div.surface').filter({ hasText: offerMessage }).first();
    await incomingOfferCard.getByLabel('Campaign name').fill(campaignName);
    await incomingOfferCard.getByRole('button', { name: 'Accept and book slot' }).click();

    const operatorActiveCampaign = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await expect(operatorActiveCampaign).toBeVisible();
    const confirmedOffer = page.locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(confirmedOffer.getByText(`Confirmed • ${campaignName}`)).toBeVisible({ timeout: 15_000 });
  } finally {
    await operatorContext.close();
  }
});
