import { expect, test } from '../fixtures';
import { requestSubmit, setTextControlValue, submitActionButtonAndAssertRedirect, waitForRouteValue } from '../helpers';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'operator', storageState: 'tests/e2e/.auth/operator.json' });

async function refreshOperatorSlot(page: import('@playwright/test').Page, note: string) {
  await waitForRouteValue({
    description: `operator slot ${note}`,
    page,
    path: roleHomePaths.operator,
    read: async () => page.locator('form.surface').filter({ hasText: note }).count(),
    until: (count) => count === 1,
  });
}

async function refreshDriverAssignment(page: import('@playwright/test').Page, campaignName: string, expectedText: string) {
  await waitForRouteValue({
    description: `driver assignment for ${campaignName}`,
    intervalMs: 2_000,
    page,
    path: roleHomePaths.driver,
    refreshMode: 'goto',
    timeoutMs: 60_000,
    read: async () => {
      const card = page.locator('div.surface').filter({ hasText: campaignName }).first();

      if (await card.count() === 0) {
        return '';
      }

      return (await card.textContent()) ?? '';
    },
    until: (text) => text.includes(expectedText),
  });
}

async function refreshOperatorOffer(page: import('@playwright/test').Page, offerMessage: string) {
  await waitForRouteValue({
    description: `operator offer ${offerMessage}`,
    page,
    path: roleHomePaths.operator,
    refreshMode: 'goto',
    read: async () => page.locator('div.surface').filter({ hasText: offerMessage }).count(),
    until: (count) => count === 1,
  });
}

async function refreshOperatorCampaign(page: import('@playwright/test').Page, campaignName: string) {
  await waitForRouteValue({
    description: `operator campaign ${campaignName}`,
    page,
    path: roleHomePaths.operator,
    refreshMode: 'goto',
    read: async () => page.locator('form.surface').filter({ hasText: campaignName }).count(),
    until: (count) => count === 1,
  });
}

async function createSlot(page: import('@playwright/test').Page, note: string, rate = '3100') {
  const createForm = page.getByTestId('operator-create-slot-form');
  await createForm.getByLabel('Region').selectOption('Houston');
  await createForm.getByLabel('Rate (USD)').fill(rate);
  await setTextControlValue(createForm.getByLabel('Campaign notes'), note);
  await requestSubmit(createForm);
  await refreshOperatorSlot(page, note);
}

test('operator can create and edit slot inventory', async ({ page, gotoRoleHome }) => {
  test.slow();
  const slotNote = `Playwright slot ${Date.now()}`;
  const updatedNote = `${slotNote} updated`;

  await gotoRoleHome();
  await expect(page.getByTestId('operator-health-summary')).toBeVisible();
  await expect(page.getByTestId('operator-attention-queue')).toBeVisible();
  await createSlot(page, slotNote);

  const slotForm = page.locator('form').filter({ hasText: slotNote }).first();
  await setTextControlValue(slotForm.getByLabel('Campaign notes'), updatedNote);
  await slotForm.getByLabel('Rate (USD)').fill('3250');
  await requestSubmit(slotForm);

  await refreshOperatorSlot(page, updatedNote);
  const updatedSlotForm = page.locator('form').filter({ hasText: updatedNote }).first();
  await expect(updatedSlotForm).toBeVisible();
  await expect(updatedSlotForm.locator('textarea[name="campaignNotes"]')).toHaveValue(updatedNote);
  await expect(updatedSlotForm.locator('input[name="rateDollars"]')).toHaveValue('3250');
});

test('operator can reject offers, progress campaigns, and review proof', async ({ browser, page, gotoRoleHome }) => {
  test.setTimeout(180_000);
  const slotNote = `Operator triage slot ${Date.now()}`;
  const dispatchSlotNote = `Dispatch slot ${Date.now()}`;
  const offerMessage = `Operator triage offer ${Date.now()}`;
  const dispatchOfferMessage = `Dispatch offer ${Date.now()}`;
  const rejectionNote = `Need a stronger rate for ${Date.now()}`;
  const dispatchCampaignName = `Dispatch campaign ${Date.now()}`;
  const dispatchInternalNote = `Assigned for live downtown loop ${Date.now()}`;
  const dispatchIssueNote = `Downtown permit hold ${Date.now()}`;
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
    await setTextControlValue(marketplaceCard.getByLabel('Offer note'), offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();

    await refreshOperatorOffer(page, offerMessage);
    const incomingOfferCard = page.locator('div.surface').filter({ hasText: offerMessage }).first();
    await incomingOfferCard.getByLabel('Rejection note').fill(rejectionNote);
    await submitActionButtonAndAssertRedirect(
      page,
      incomingOfferCard.getByRole('button', { name: 'Reject offer' }),
      roleHomePaths.operator,
      'Operator offer rejection failed',
    );
    await expect(page.locator('div.surface').filter({ hasText: offerMessage }).first()).toContainText(rejectionNote, {
      timeout: 30_000,
    });

    await page.goto(roleHomePaths.operator);
    await createSlot(page, dispatchSlotNote, '3600');

    await plannerPage.goto(roleHomePaths.planner);
    const dispatchMarketplaceCard = plannerPage.locator('div.surface').filter({ hasText: dispatchSlotNote }).first();
    await dispatchMarketplaceCard.getByLabel('Offer amount (USD)').fill('3725');
    await setTextControlValue(dispatchMarketplaceCard.getByLabel('Offer note'), dispatchOfferMessage);
    await dispatchMarketplaceCard.getByRole('button', { name: 'Submit offer' }).click();

    await refreshOperatorOffer(page, dispatchOfferMessage);
    const dispatchOfferCard = page.locator('div.surface').filter({ hasText: dispatchOfferMessage }).first();
    await dispatchOfferCard.getByLabel('Campaign name').fill(dispatchCampaignName);
    await dispatchOfferCard.getByLabel('Operator note').fill('Accepted for the best available launch route.');
    await submitActionButtonAndAssertRedirect(
      page,
      dispatchOfferCard.getByRole('button', { name: 'Accept and book slot' }),
      roleHomePaths.operator,
      'Operator dispatch offer acceptance failed',
    );
    await refreshOperatorCampaign(page, dispatchCampaignName);

    const dispatchCampaignCard = page.locator('form.surface').filter({ hasText: dispatchCampaignName }).first();
    await dispatchCampaignCard.getByLabel('Assigned driver').selectOption('33333333-3333-3333-3333-333333333333');
    await dispatchCampaignCard.getByLabel('Booking status').selectOption('in_progress');
    await dispatchCampaignCard.getByLabel('Run status').selectOption('en_route');
    await dispatchCampaignCard.locator('input[name="proofRequired"]').uncheck();
    await dispatchCampaignCard.getByLabel('Internal note').fill(dispatchInternalNote);
    await submitActionButtonAndAssertRedirect(
      page,
      dispatchCampaignCard.getByRole('button', { name: 'Save dispatch plan' }),
      roleHomePaths.operator,
      'Operator dispatch save failed',
    );

    const updatedDispatchCampaignCard = page.locator('form.surface').filter({ hasText: dispatchCampaignName }).first();
    await expect(updatedDispatchCampaignCard.locator('textarea[name="internalNote"]')).toHaveValue(dispatchInternalNote);
    await expect(updatedDispatchCampaignCard.locator('select[name="driverId"]')).toHaveValue('33333333-3333-3333-3333-333333333333');
    await expect(updatedDispatchCampaignCard).toContainText('Rolling');
    await expect(updatedDispatchCampaignCard).toContainText('The truck is on the move.');

    await refreshDriverAssignment(driverPage, dispatchCampaignName, 'En Route');

    await updatedDispatchCampaignCard.getByLabel('Issue note').fill(dispatchIssueNote);
    await submitActionButtonAndAssertRedirect(
      page,
      updatedDispatchCampaignCard.getByRole('button', { name: 'Pause route' }),
      roleHomePaths.operator,
      'Operator pause route failed',
    );
    const pausedDispatchCampaignCard = page.locator('form.surface').filter({ hasText: dispatchCampaignName }).first();
    await expect(pausedDispatchCampaignCard).toContainText('Issue');
    await expect(pausedDispatchCampaignCard.locator('textarea[name="issueNote"]')).toHaveValue(dispatchIssueNote);
    await expect(pausedDispatchCampaignCard).toContainText(dispatchIssueNote);
    await expect(page.getByTestId('operator-attention-queue')).toContainText(dispatchCampaignName);
    await expect(page.getByTestId('operator-attention-queue')).toContainText(dispatchIssueNote);
    await refreshDriverAssignment(driverPage, dispatchCampaignName, 'Issue');

    await submitActionButtonAndAssertRedirect(
      page,
      pausedDispatchCampaignCard.getByRole('button', { name: 'Resolve issue' }),
      roleHomePaths.operator,
      'Operator issue resolve failed',
    );
    const resumedDispatchCampaignCard = page.locator('form.surface').filter({ hasText: dispatchCampaignName }).first();
    await expect(resumedDispatchCampaignCard).toContainText('Rolling');
    await expect(resumedDispatchCampaignCard.locator('textarea[name="issueNote"]')).toHaveValue('');
    await expect(resumedDispatchCampaignCard).toContainText('Resolved');
    await refreshDriverAssignment(driverPage, dispatchCampaignName, 'En Route');

    await page.goto(roleHomePaths.operator);
    const activeCampaignCard = page.locator('form.surface').filter({ hasText: 'Dallas Product Launch' }).first();
    await activeCampaignCard.getByLabel('Assigned driver').selectOption('33333333-3333-3333-3333-333333333333');
    await activeCampaignCard.getByLabel('Booking status').selectOption('in_progress');
    await activeCampaignCard.getByLabel('Run status').selectOption('live');
    await setTextControlValue(activeCampaignCard.getByLabel('Internal note'), internalNote);
    await requestSubmit(activeCampaignCard);
    const updatedCampaignCard = page.locator('form.surface').filter({ hasText: 'Dallas Product Launch' }).first();
    await expect(updatedCampaignCard.locator('textarea[name="internalNote"]')).toHaveValue(internalNote);

    await driverPage.goto(roleHomePaths.driver);
    const driverCampaignCard = driverPage.locator('div.surface').filter({ hasText: 'Dallas Product Launch' }).first();
    const uploadInput = driverCampaignCard.getByTestId(/driver-proof-file-input-/);
    await uploadInput.setInputFiles({
      buffer: Buffer.from('operator-proof-review'),
      mimeType: 'image/jpeg',
      name: proofFileName,
    });
    await driverCampaignCard.getByTestId(/driver-proof-upload-button-/).click();
    await waitForRouteValue({
      description: `driver proof upload ${proofFileName}`,
      intervalMs: 2_000,
      page: driverPage,
      path: roleHomePaths.driver,
      timeoutMs: 60_000,
      read: async () => driverPage.locator('div.pill').filter({ hasText: proofFileName }).count(),
      until: (count) => count === 1,
    });

    await page.goto(roleHomePaths.operator);
    const proofCard = page.locator('form.surface').filter({ hasText: proofFileName }).first();
    await expect(proofCard.getByTestId(/operator-proof-view-cta-/)).toBeVisible();
    await proofCard.getByLabel('Review note').fill(proofReviewNote);
    await submitActionButtonAndAssertRedirect(
      page,
      proofCard.getByRole('button', { name: 'Reject proof' }),
      roleHomePaths.operator,
      'Operator proof rejection failed',
    );
    await waitForRouteValue({
      description: `operator proof review ${proofFileName}`,
      intervalMs: 2_000,
      page,
      path: roleHomePaths.operator,
      timeoutMs: 60_000,
      read: async () => {
        const card = page.locator('form.surface').filter({ hasText: proofFileName }).first();
        if (await card.count() === 0) {
          return '';
        }
        return (await card.textContent()) ?? '';
      },
      until: (text) => text.includes(proofReviewNote) && text.includes('Review already completed'),
    });

    await driverPage.goto(roleHomePaths.driver);
    const rejectedProofCard = driverPage.locator('div.pill').filter({ hasText: proofFileName }).first();
    await expect(rejectedProofCard).toContainText('Upload another proof file');
  } finally {
    await plannerContext.close();
    await driverContext.close();
  }
});
