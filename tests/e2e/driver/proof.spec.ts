import { expect, test } from '../fixtures';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'driver', storageState: 'tests/e2e/.auth/driver.json' });

test('driver can upload proof into Supabase storage and receive operator review live', async ({ browser, page, gotoRoleHome }) => {
  const fileName = `proof-${Date.now()}.jpg`;
  const reviewNote = `Approved for client share ${Date.now()}`;
  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();

  try {
    await gotoRoleHome();
    await expect(page.getByTestId('live-sync-badge')).toBeVisible();

    const uploadInput = page.getByTestId('driver-proof-file-input').first();
    await uploadInput.setInputFiles({
      buffer: Buffer.from('fake-jpeg-proof'),
      mimeType: 'image/jpeg',
      name: fileName,
    });
    await page.getByTestId('driver-proof-upload-button').first().click();

    await expect(page.getByText('Proof uploaded to Supabase storage.')).toBeVisible();
    await expect(page.getByText(fileName)).toBeVisible();

    await operatorPage.goto(roleHomePaths.operator);
    const proofCard = operatorPage.locator('form.surface').filter({ hasText: fileName }).first();
    await proofCard.getByLabel('Review note').fill(reviewNote);
    await proofCard.getByRole('button', { name: 'Approve proof' }).click();
    await expect(operatorPage.getByText('Proof review saved.')).toBeVisible();

    const driverProofCard = page.locator('div.pill').filter({ hasText: fileName }).first();
    await expect(driverProofCard.getByText('Approved', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(driverProofCard.getByText(reviewNote)).toBeVisible({ timeout: 15_000 });
  } finally {
    await operatorContext.close();
  }
});

test('driver can progress an assigned run through execution states', async ({ browser, page, gotoRoleHome }) => {
  const slotNote = `Driver execution slot ${Date.now()}`;
  const offerMessage = `Driver execution offer ${Date.now()}`;
  const campaignName = `Driver execution campaign ${Date.now()}`;
  const proofFileName = `driver-execution-${Date.now()}.jpg`;

  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();
  const plannerContext = await browser.newContext({ storageState: authFiles.planner });
  const plannerPage = await plannerContext.newPage();

  try {
    await operatorPage.goto(roleHomePaths.operator);
    const createForm = operatorPage.getByTestId('operator-create-slot-form');
    await createForm.getByLabel('Region').selectOption('Houston');
    await createForm.getByLabel('Rate (USD)').fill('3550');
    await createForm.getByLabel('Campaign notes').fill(slotNote);
    await createForm.getByRole('button', { name: 'Create slot' }).click();
    await expect(operatorPage.getByText('Slot inventory created.')).toBeVisible();

    await plannerPage.goto(roleHomePaths.planner);
    const marketplaceCard = plannerPage.locator('div.surface').filter({ hasText: slotNote }).first();
    await marketplaceCard.getByLabel('Offer amount (USD)').fill('3650');
    await marketplaceCard.getByLabel('Offer note').fill(offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();
    await expect(plannerPage.getByText('Offer submitted to the operator.')).toBeVisible();

    await operatorPage.goto(roleHomePaths.operator);
    const incomingOfferCard = operatorPage.locator('div.surface').filter({ hasText: offerMessage }).first();
    await incomingOfferCard.getByLabel('Campaign name').fill(campaignName);
    await incomingOfferCard.getByRole('button', { name: 'Accept and book slot' }).click();
    await expect(operatorPage.getByText('Offer accepted and slot booked.')).toBeVisible();

    const dispatchCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await dispatchCard.getByLabel('Assigned driver').selectOption({ label: 'Drew Driver' });
    await dispatchCard.getByRole('button', { name: 'Save dispatch plan' }).click();
    await expect(operatorPage.getByText('Campaign execution updated.')).toBeVisible();

    await gotoRoleHome();
    const runCard = page.locator('div.surface').filter({ hasText: campaignName }).first();
    await expect(runCard).toBeVisible();
    await expect(runCard.getByText('Assigned', { exact: true })).toBeVisible();

    await runCard.getByRole('button', { name: 'Mark en route' }).click();
    await expect(page.getByText('Run status updated.')).toBeVisible();
    await expect(runCard.getByText('En Route', { exact: true })).toBeVisible();

    await runCard.getByRole('button', { name: 'Mark live' }).click();
    await expect(page.getByText('Run status updated.')).toBeVisible();
    await expect(runCard.getByText('Live', { exact: true })).toBeVisible();
    await expect(page.getByText('Upload at least one proof file before completing this run.')).toBeVisible();

    await runCard.getByRole('button', { name: 'Complete run' }).click();
    await expect(page.getByText('Upload at least one proof file before completing a proof-required run.')).toBeVisible();

    const uploadInput = runCard.getByTestId('driver-proof-file-input');
    await uploadInput.setInputFiles({
      buffer: Buffer.from('driver-execution-proof'),
      mimeType: 'image/jpeg',
      name: proofFileName,
    });
    await runCard.getByTestId('driver-proof-upload-button').click();
    await expect(page.getByText('Proof uploaded to Supabase storage.')).toBeVisible();

    await runCard.getByRole('button', { name: 'Complete run' }).click();
    await expect(page.getByText('Run status updated.')).toBeVisible();
    await expect(runCard.getByText('Completed', { exact: true })).toBeVisible();

    await plannerPage.goto(roleHomePaths.planner);
    const completedOffer = plannerPage.locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(completedOffer.getByText(`Completed • ${campaignName}`)).toBeVisible({ timeout: 15_000 });
  } finally {
    await operatorContext.close();
    await plannerContext.close();
  }
});
