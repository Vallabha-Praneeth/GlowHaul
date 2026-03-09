import { expect, test } from '../fixtures';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'operator', storageState: 'tests/e2e/.auth/operator.json' });

async function createSlot(page: import('@playwright/test').Page, note: string, rate = '3100') {
  const createForm = page.getByTestId('operator-create-slot-form');
  await createForm.getByLabel('Region').selectOption('Houston');
  await createForm.getByLabel('Rate (USD)').fill(rate);
  await createForm.getByLabel('Campaign notes').fill(note);
  await createForm.getByRole('button', { name: 'Create slot' }).click();
  await expect(page.getByText('Slot inventory created.')).toBeVisible();
}

test('operator can create and edit slot inventory', async ({ page, gotoRoleHome }) => {
  const slotNote = `Playwright slot ${Date.now()}`;
  const updatedNote = `${slotNote} updated`;

  await gotoRoleHome();
  await createSlot(page, slotNote);

  const slotForm = page.locator('form').filter({ hasText: slotNote }).first();
  await slotForm.getByLabel('Campaign notes').fill(updatedNote);
  await slotForm.getByLabel('Rate (USD)').fill('3250');
  await slotForm.getByRole('button', { name: 'Save slot changes' }).click();

  await expect(page.getByText('Slot inventory updated.')).toBeVisible();
  const updatedSlotForm = page.locator('form').filter({ hasText: updatedNote }).first();
  await expect(updatedSlotForm).toBeVisible();
  await expect(updatedSlotForm.locator('textarea[name="campaignNotes"]')).toHaveValue(updatedNote);
  await expect(updatedSlotForm.locator('input[name="rateDollars"]')).toHaveValue('3250');
});

test('operator can reject offers, progress campaigns, and review proof', async ({ browser, page, gotoRoleHome }) => {
  const slotNote = `Operator triage slot ${Date.now()}`;
  const dispatchSlotNote = `Dispatch slot ${Date.now()}`;
  const offerMessage = `Operator triage offer ${Date.now()}`;
  const dispatchOfferMessage = `Dispatch offer ${Date.now()}`;
  const rejectionNote = `Need a stronger rate for ${Date.now()}`;
  const dispatchCampaignName = `Dispatch campaign ${Date.now()}`;
  const dispatchInternalNote = `Assigned for live downtown loop ${Date.now()}`;
  const internalNote = `Run live in downtown corridor ${Date.now()}`;
  const proofFileName = `operator-proof-${Date.now()}.jpg`;
  const proofReviewNote = `Need a clearer truck angle ${Date.now()}`;

  const plannerContext = await browser.newContext({ storageState: authFiles.planner });
  const plannerPage = await plannerContext.newPage();
  const driverContext = await browser.newContext({ storageState: authFiles.driver });
  const driverPage = await driverContext.newPage();

  try {
    await gotoRoleHome();
    await createSlot(page, slotNote, '3400');

    await plannerPage.goto(roleHomePaths.planner);
    const marketplaceCard = plannerPage.locator('div.surface').filter({ hasText: slotNote }).first();
    await marketplaceCard.getByLabel('Offer amount (USD)').fill('3450');
    await marketplaceCard.getByLabel('Offer note').fill(offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();
    await expect(plannerPage.getByText('Offer submitted to the operator.')).toBeVisible();

    await page.goto(roleHomePaths.operator);
    const incomingOfferCard = page.locator('div.surface').filter({ hasText: offerMessage }).first();
    await incomingOfferCard.getByLabel('Rejection note').fill(rejectionNote);
    await incomingOfferCard.getByRole('button', { name: 'Reject offer' }).click();
    await expect(page.getByText('Offer rejected.')).toBeVisible();
    await expect(page.getByText(rejectionNote)).toBeVisible();

    await page.goto(roleHomePaths.operator);
    await createSlot(page, dispatchSlotNote, '3600');

    await plannerPage.goto(roleHomePaths.planner);
    const dispatchMarketplaceCard = plannerPage.locator('div.surface').filter({ hasText: dispatchSlotNote }).first();
    await dispatchMarketplaceCard.getByLabel('Offer amount (USD)').fill('3725');
    await dispatchMarketplaceCard.getByLabel('Offer note').fill(dispatchOfferMessage);
    await dispatchMarketplaceCard.getByRole('button', { name: 'Submit offer' }).click();
    await expect(plannerPage.getByText('Offer submitted to the operator.')).toBeVisible();

    await page.goto(roleHomePaths.operator);
    const dispatchOfferCard = page.locator('div.surface').filter({ hasText: dispatchOfferMessage }).first();
    await dispatchOfferCard.getByLabel('Campaign name').fill(dispatchCampaignName);
    await dispatchOfferCard.getByLabel('Operator note').fill('Accepted for the best available launch route.');
    await dispatchOfferCard.getByRole('button', { name: 'Accept and book slot' }).click();
    await expect(page.getByText('Offer accepted and slot booked.')).toBeVisible();

    const dispatchCampaignCard = page.locator('form.surface').filter({ hasText: dispatchCampaignName }).first();
    await dispatchCampaignCard.getByLabel('Assigned driver').selectOption({ label: 'Drew Driver' });
    await dispatchCampaignCard.getByLabel('Booking status').selectOption('in_progress');
    await dispatchCampaignCard.getByLabel('Run status').selectOption('en_route');
    await dispatchCampaignCard.locator('input[name="proofRequired"]').uncheck();
    await dispatchCampaignCard.getByLabel('Internal note').fill(dispatchInternalNote);
    await dispatchCampaignCard.getByRole('button', { name: 'Save dispatch plan' }).click();
    await expect(page.getByText('Campaign execution updated.')).toBeVisible();

    const updatedDispatchCampaignCard = page.locator('form.surface').filter({ hasText: dispatchCampaignName }).first();
    await expect(updatedDispatchCampaignCard.locator('textarea[name="internalNote"]')).toHaveValue(dispatchInternalNote);
    await expect(updatedDispatchCampaignCard.locator('select[name="driverId"]')).toHaveValue('33333333-3333-3333-3333-333333333333');

    await driverPage.goto(roleHomePaths.driver);
    const dispatchedRunCard = driverPage.locator('div.surface').filter({ hasText: dispatchCampaignName }).first();
    await expect(dispatchedRunCard).toBeVisible();
    await expect(dispatchedRunCard.getByText('En Route', { exact: true }).first()).toBeVisible();

    await page.goto(roleHomePaths.operator);
    const activeCampaignCard = page.locator('form.surface').filter({ hasText: 'Dallas Product Launch' }).first();
    await activeCampaignCard.getByLabel('Assigned driver').selectOption({ label: 'Drew Driver' });
    await activeCampaignCard.getByLabel('Booking status').selectOption('in_progress');
    await activeCampaignCard.getByLabel('Run status').selectOption('live');
    await activeCampaignCard.getByLabel('Internal note').fill(internalNote);
    await activeCampaignCard.getByRole('button', { name: 'Save dispatch plan' }).click();
    await expect(page).toHaveURL(/\/operator\?notice=/);
    const updatedCampaignCard = page.locator('form.surface').filter({ hasText: 'Dallas Product Launch' }).first();
    await expect(updatedCampaignCard.locator('textarea[name="internalNote"]')).toHaveValue(internalNote);

    await driverPage.goto(roleHomePaths.driver);
    const uploadInput = driverPage.getByTestId('driver-proof-file-input').first();
    await uploadInput.setInputFiles({
      buffer: Buffer.from('operator-proof-review'),
      mimeType: 'image/jpeg',
      name: proofFileName,
    });
    await driverPage.getByTestId('driver-proof-upload-button').first().click();
    await expect(driverPage.getByText('Proof uploaded to Supabase storage.')).toBeVisible();

    await page.goto(roleHomePaths.operator);
    const proofCard = page.locator('form.surface').filter({ hasText: proofFileName }).first();
    await proofCard.getByLabel('Review note').fill(proofReviewNote);
    await proofCard.getByRole('button', { name: 'Reject proof' }).click();
    await expect(page).toHaveURL(/\/operator\?notice=/);
    await expect(page.getByText(proofReviewNote)).toBeVisible();
  } finally {
    await plannerContext.close();
    await driverContext.close();
  }
});
