import { expect, test } from '../fixtures';
import { requestSubmit, setTextControlValue, waitForRouteValue } from '../helpers';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'planner', storageState: authFiles.planner });

async function refreshOperatorSlot(page: import('@playwright/test').Page, slotNote: string) {
  await waitForRouteValue({
    description: `operator slot ${slotNote}`,
    page,
    path: roleHomePaths.operator,
    read: async () => page.locator('form.surface').filter({ hasText: slotNote }).count(),
    until: (count) => count === 1,
  });
}

async function refreshOperatorCampaign(page: import('@playwright/test').Page, campaignName: string) {
  await waitForRouteValue({
    description: `operator campaign ${campaignName}`,
    page,
    path: roleHomePaths.operator,
    read: async () => page.locator('form.surface').filter({ hasText: campaignName }).count(),
    until: (count) => count === 1,
  });
}

async function refreshOperatorOffer(page: import('@playwright/test').Page, offerMessage: string) {
  await waitForRouteValue({
    description: `operator offer ${offerMessage}`,
    page,
    path: roleHomePaths.operator,
    read: async () => page.locator('div.surface').filter({ hasText: offerMessage }).count(),
    until: (count) => count === 1,
  });
}

async function refreshPlannerOffer(page: import('@playwright/test').Page, offerMessage: string) {
  await waitForRouteValue({
    description: `planner offer ${offerMessage}`,
    page,
    path: roleHomePaths.planner,
    read: async () => page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: offerMessage }).count(),
    until: (count) => count === 1,
  });
}

async function refreshPlannerTrackerCard(
  page: import('@playwright/test').Page,
  campaignName: string,
  matcher: (text: string) => boolean
) {
  await waitForRouteValue({
    description: `planner tracker ${campaignName}`,
    intervalMs: 2_000,
    page,
    path: roleHomePaths.planner,
    timeoutMs: 60_000,
    read: async () => {
      const card = page.getByTestId('planner-campaign-tracker').locator('div.pill').filter({ hasText: campaignName }).first();
      if (await card.count() === 0) {
        return '';
      }
      return (await card.textContent()) ?? '';
    },
    until: matcher,
  });
}

async function submitDriverTransition(page: import('@playwright/test').Page, campaignName: string) {
  const runCard = page.locator('div.surface').filter({ hasText: campaignName }).first();
  await requestSubmit(runCard.locator('form').first());
}

test('planner marketplace exposes free-first map strategy and filter controls', async ({ browser, page, gotoRoleHome }) => {
  test.setTimeout(180_000);
  const slotNote = `Planner filter slot ${Date.now()}`;
  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();

  try {
    await operatorPage.goto(roleHomePaths.operator);
    const createForm = operatorPage.getByTestId('operator-create-slot-form');
    await createForm.getByLabel('Region').selectOption('Houston');
    await createForm.getByLabel('Rate (USD)').fill('4100');
    await setTextControlValue(createForm.getByLabel('Campaign notes'), slotNote);
    await requestSubmit(createForm);
    await refreshOperatorSlot(operatorPage, slotNote);

    await gotoRoleHome();
    await expect(page.getByText('Map provider: MapLibre-ready')).toBeVisible();
    await expect(page.getByTestId('live-sync-badge')).toBeVisible();
    await page.getByLabel('Search').fill(slotNote);
    await page.getByLabel('Region').selectOption('Houston');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.locator('div.surface').filter({ hasText: slotNote }).first()).toBeVisible();
    await expect(page.getByText('Visible slots: 1')).toBeVisible();
  } finally {
    await operatorContext.close();
  }
});

test('planner offer can be submitted and later shows execution and proof state via live refresh', async ({ browser, page }) => {
  test.setTimeout(180_000);
  const slotNote = `Planner flow slot ${Date.now()}`;
  const offerMessage = `Planner offer ${Date.now()}`;
  const campaignName = `Planner booking ${Date.now()}`;
  const proofFileName = `planner-visibility-${Date.now()}.jpg`;

  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();
  const driverContext = await browser.newContext({ storageState: authFiles.driver });
  const driverPage = await driverContext.newPage();

  try {
    await operatorPage.goto(roleHomePaths.operator);
    const createForm = operatorPage.getByTestId('operator-create-slot-form');
    await createForm.getByLabel('Region').selectOption('Houston');
    await createForm.getByLabel('Rate (USD)').fill('3300');
    await setTextControlValue(createForm.getByLabel('Campaign notes'), slotNote);
    await requestSubmit(createForm);
    await refreshOperatorSlot(operatorPage, slotNote);

    await page.goto(roleHomePaths.planner);
    await expect(page.getByText('Map provider: MapLibre-ready')).toBeVisible();

    const marketplaceCard = page.locator('div.surface').filter({ hasText: slotNote }).first();
    await marketplaceCard.getByLabel('Offer amount (USD)').fill('3450');
    await setTextControlValue(marketplaceCard.getByLabel('Offer note'), offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();

    await refreshPlannerOffer(page, offerMessage);
    await refreshOperatorOffer(operatorPage, offerMessage);
    const incomingOfferCard = operatorPage.locator('div.surface').filter({ hasText: offerMessage }).first();
    await setTextControlValue(incomingOfferCard.getByLabel('Campaign name'), campaignName);
    await incomingOfferCard.getByRole('button', { name: 'Accept and book slot' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);

    const operatorActiveCampaign = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await expect(operatorActiveCampaign).toBeVisible();
    await operatorActiveCampaign.getByLabel('Assigned driver').selectOption({ label: 'Drew Driver' });
    await operatorActiveCampaign.getByRole('button', { name: 'Save dispatch plan' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);

    await page.goto(roleHomePaths.planner);
    const confirmedOffer = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(confirmedOffer).toContainText(`Confirmed • ${campaignName}`, { timeout: 15_000 });
    await expect(confirmedOffer).toContainText('Execution: Assigned', { timeout: 15_000 });
    await expect(confirmedOffer).toContainText('Proof:', { timeout: 15_000 });
    const scheduledTrackerCard = page.getByTestId('planner-campaign-tracker').getByTestId(/planner-tracker-card-/).filter({ hasText: campaignName }).first();
    await expect(scheduledTrackerCard).toContainText('Scheduled', { timeout: 15_000 });
    await expect(scheduledTrackerCard).toContainText('Driver dispatched', { timeout: 15_000 });

    await driverPage.goto(roleHomePaths.driver);
    const getDriverRunCard = () => driverPage.locator('div.surface').filter({ hasText: campaignName }).first();
    await submitDriverTransition(driverPage, campaignName);
    await waitForRouteValue({
      description: `driver assignment for ${campaignName}`,
      intervalMs: 2_000,
      page: driverPage,
      path: roleHomePaths.driver,
      timeoutMs: 60_000,
      read: async () => {
        const card = getDriverRunCard();
        if (await card.count() === 0) {
          return '';
        }
        return (await card.textContent()) ?? '';
      },
      until: (text) => text.includes('En Route'),
    });

    await refreshPlannerTrackerCard(page, campaignName, (text) => text.includes('En route'));
    const executingOffer = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(executingOffer).toContainText('Execution: En Route', { timeout: 15_000 });

    const uploadInput = getDriverRunCard().getByTestId(/driver-proof-file-input-/);
    await uploadInput.setInputFiles({
      buffer: Buffer.from('planner-visibility-proof'),
      mimeType: 'image/jpeg',
      name: proofFileName,
    });
    await getDriverRunCard().getByTestId(/driver-proof-upload-button-/).click();
    await waitForRouteValue({
      description: `driver proof upload ${proofFileName}`,
      intervalMs: 2_000,
      page: driverPage,
      path: roleHomePaths.driver,
      timeoutMs: 60_000,
      read: async () => driverPage.locator('div.pill').filter({ hasText: proofFileName }).count(),
      until: (count) => count === 1,
    });

    await refreshPlannerTrackerCard(page, campaignName, (text) => text.includes('Proof review'));
    const proofVisibleOffer = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(proofVisibleOffer).toContainText('Uploaded', { timeout: 15_000 });
    await expect(proofVisibleOffer).toContainText('proof logged', { timeout: 15_000 });
    const proofReviewTrackerCard = page.getByTestId('planner-campaign-tracker').getByTestId(/planner-tracker-card-/).filter({ hasText: campaignName }).first();
    await expect(proofReviewTrackerCard).toContainText('Proof review', { timeout: 15_000 });
  } finally {
    await operatorContext.close();
    await driverContext.close();
  }
});
