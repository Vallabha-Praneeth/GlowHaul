import { expect, test } from '../fixtures';
import {
  requestSubmit,
  setTextControlValue,
  submitActionButtonAndAssertRedirect,
  waitForRouteValue,
} from '../helpers';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'planner', storageState: authFiles.planner });

async function refreshOperatorSlot(page: import('@playwright/test').Page, slotNote: string) {
  await waitForRouteValue({
    description: `operator slot ${slotNote}`,
    page,
    path: roleHomePaths.operator,
    refreshMode: 'goto',
    read: async () =>
      page
        .getByTestId('operator-inventory-editor')
        .locator('form.surface')
        .filter({ hasText: slotNote })
        .count(),
    until: (count) => count === 1,
  });
}

async function refreshOperatorCampaign(page: import('@playwright/test').Page, campaignName: string) {
  await waitForRouteValue({
    description: `operator campaign ${campaignName}`,
    page,
    path: roleHomePaths.operator,
    refreshMode: 'goto',
    read: async () =>
      page
        .getByTestId('operator-dispatch-board')
        .locator('form.surface')
        .filter({ hasText: campaignName })
        .count(),
    until: (count) => count === 1,
  });
}

async function refreshOperatorOffer(page: import('@playwright/test').Page, offerMessage: string) {
  await waitForRouteValue({
    description: `operator offer ${offerMessage}`,
    page,
    path: roleHomePaths.operator,
    refreshMode: 'goto',
    read: async () =>
      page
        .getByTestId('operator-incoming-offers-list')
        .locator('div.surface')
        .filter({ hasText: offerMessage })
        .count(),
    until: (count) => count === 1,
  });
}

async function refreshPlannerOffer(page: import('@playwright/test').Page, offerMessage: string) {
  await waitForRouteValue({
    description: `planner offer ${offerMessage}`,
    page,
    path: roleHomePaths.planner,
    refreshMode: 'goto',
    read: async () => page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: offerMessage }).count(),
    until: (count) => count === 1,
  });
}

async function refreshDriverRunCardUntil(
  page: import('@playwright/test').Page,
  campaignName: string,
  expectedText: string,
  refreshMode: 'goto' | 'none' = 'none',
  timeoutMs = 60_000,
) {
  await waitForRouteValue({
    description: `driver run card ${campaignName}`,
    intervalMs: 2_000,
    page,
    path: roleHomePaths.driver,
    refreshMode,
    timeoutMs,
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
    await expect(page.getByTestId('planner-campaign-health')).toBeVisible();
    await expect(page.getByTestId('planner-attention-queue')).toBeVisible();
    await expect(page.getByTestId('planner-recent-history')).toBeVisible();
    const marketplaceFilters = page.locator('form[method="get"]').first();
    await marketplaceFilters.getByLabel('Search', { exact: true }).fill(slotNote);
    await marketplaceFilters.getByLabel('Region').selectOption('Houston');
    await marketplaceFilters.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.locator('div.surface').filter({ hasText: slotNote }).first()).toBeVisible();
    await expect(page.getByText('Visible slots: 1')).toBeVisible();
  } finally {
    await operatorContext.close();
  }
});

test('planner offer reflects operator dispatch and execution state', async ({ browser, page }) => {
  test.setTimeout(300_000);
  const slotNote = `Planner flow slot ${Date.now()}`;
  const offerMessage = `Planner offer ${Date.now()}`;
  const campaignName = `Planner booking ${Date.now()}`;

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
    await createForm.getByTestId('operator-create-slot-submit').click();
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
    await operatorActiveCampaign.getByLabel('Assigned driver').selectOption('33333333-3333-3333-3333-333333333333');
    await operatorActiveCampaign.getByLabel('Booking status').selectOption('in_progress');
    await operatorActiveCampaign.getByLabel('Run status').selectOption('en_route');
    await operatorActiveCampaign.getByRole('button', { name: 'Save dispatch plan' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);
    await expect(operatorPage.locator('form.surface').filter({ hasText: campaignName }).first().locator('select[name="driverId"]')).toHaveValue('33333333-3333-3333-3333-333333333333');

    await page.goto(roleHomePaths.planner);
    const confirmedOffer = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(confirmedOffer).toContainText(`In Progress • ${campaignName}`, { timeout: 15_000 });
    await waitForRouteValue({
      description: `planner en route state for ${campaignName}`,
      intervalMs: 2_000,
      page,
      path: roleHomePaths.planner,
      timeoutMs: 60_000,
      read: async () => {
        const card = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
        if (await card.count() === 0) {
          return '';
        }
        return (await card.textContent()) ?? '';
      },
      until: (text) => text.includes('Execution: En Route') && text.includes('Proof:'),
    });

    await driverPage.goto(roleHomePaths.driver);
    const getDriverRunCard = () => driverPage.locator('div.surface').filter({ hasText: campaignName }).first();
    await expect(getDriverRunCard()).toContainText('En Route', { timeout: 15_000 });

    await operatorPage.goto(roleHomePaths.operator);
    const liveCampaignCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await liveCampaignCard.getByLabel('Run status').selectOption('live');
    await liveCampaignCard.getByRole('button', { name: 'Save dispatch plan' }).click();

    await waitForRouteValue({
      description: `driver live state for ${campaignName}`,
      intervalMs: 2_000,
      page: driverPage,
      path: roleHomePaths.driver,
      refreshMode: 'goto',
      timeoutMs: 60_000,
      read: async () => {
        const card = getDriverRunCard();
        if (await card.count() === 0) {
          return '';
        }
        return (await card.textContent()) ?? '';
      },
      until: (text) => text.includes('Live'),
    });
  } finally {
    await operatorContext.close();
    await driverContext.close();
  }
});

test('planner can close out a completed campaign and publish a public recap', async ({ browser, page }) => {
  test.setTimeout(420_000);
  const slotNote = `Planner recap slot ${Date.now()}`;
  const offerMessage = `Planner recap offer ${Date.now()}`;
  const campaignName = `Planner recap booking ${Date.now()}`;
  const closeoutNote = `Client-ready recap for ${campaignName}`;

  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();
  const driverContext = await browser.newContext({ storageState: authFiles.driver });
  const driverPage = await driverContext.newPage();

  try {
    await operatorPage.goto(roleHomePaths.operator);
    const createForm = operatorPage.getByTestId('operator-create-slot-form');
    await createForm.getByLabel('Region').selectOption('Houston');
    await createForm.getByLabel('Rate (USD)').fill('3350');
    await setTextControlValue(createForm.getByLabel('Campaign notes'), slotNote);
    await createForm.getByTestId('operator-create-slot-submit').click();
    await refreshOperatorSlot(operatorPage, slotNote);

    await page.goto(roleHomePaths.planner);
    const marketplaceCard = page.locator('div.surface').filter({ hasText: slotNote }).first();
    await marketplaceCard.getByLabel('Offer amount (USD)').fill('3450');
    await setTextControlValue(marketplaceCard.getByLabel('Offer note'), offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();

    await refreshOperatorOffer(operatorPage, offerMessage);
    const incomingOfferCard = operatorPage.locator('div.surface').filter({ hasText: offerMessage }).first();
    await setTextControlValue(incomingOfferCard.getByLabel('Campaign name'), campaignName);
    await incomingOfferCard.getByRole('button', { name: 'Accept and book slot' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);

    const operatorCampaign = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await operatorCampaign.getByLabel('Assigned driver').selectOption('33333333-3333-3333-3333-333333333333');
    await operatorCampaign.getByLabel('Booking status').selectOption('in_progress');
    await operatorCampaign.getByLabel('Run status').selectOption('live');
    await operatorCampaign.locator('input[name="proofRequired"]').uncheck();
    await operatorCampaign.getByRole('button', { name: 'Save dispatch plan' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);

    await driverPage.goto(roleHomePaths.driver);
    const getDriverRunCard = () => driverPage.locator('div.surface').filter({ hasText: campaignName }).first();
    await refreshDriverRunCardUntil(driverPage, campaignName, 'Live', 'goto');

    await operatorPage.goto(roleHomePaths.operator);
    const completedCampaign = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await completedCampaign.getByLabel('Booking status').selectOption('completed');
    await completedCampaign.getByLabel('Run status').selectOption('completed');
    await completedCampaign.getByRole('button', { name: 'Save dispatch plan' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);
    const recapHref = await completedCampaign.getByRole('link', { name: 'Open recap' }).getAttribute('href');
    expect(recapHref).toBeTruthy();

    await page.goto(recapHref!);

    await expect(page.getByTestId('campaign-recap-page')).toBeVisible();
    await expect(page.getByTestId('campaign-recap-share-policy')).toContainText(
      'Use Print / Save PDF for client-safe distribution.',
    );

    const recapPath = new URL(page.url()).pathname;
    await setTextControlValue(page.getByLabel('Closeout note'), closeoutNote);
    await submitActionButtonAndAssertRedirect(
      page,
      page.getByTestId('campaign-recap-mark-client-ready'),
      recapPath,
      'Planner mark client-ready failed',
    );
    await waitForRouteValue({
      description: `planner client-ready recap ${campaignName}`,
      intervalMs: 1_500,
      page,
      path: recapPath,
      refreshMode: 'goto',
      timeoutMs: 60_000,
      read: async () => (await page.getByTestId('campaign-recap-share-manager').textContent()) ?? '',
      until: (text) => text.includes('Client-ready'),
    });
    await expect(page.getByTestId('campaign-recap-summary')).toContainText(closeoutNote);

    await submitActionButtonAndAssertRedirect(
      page,
      page.getByTestId('campaign-recap-create-public-share'),
      recapPath,
      'Planner create public recap share failed',
    );
    await waitForRouteValue({
      description: `planner public recap link ${campaignName}`,
      intervalMs: 1_500,
      page,
      path: recapPath,
      refreshMode: 'goto',
      timeoutMs: 60_000,
      read: async () => page.getByTestId('campaign-recap-public-link').count(),
      until: (count) => count === 1,
    });
    const publicLink = page.getByTestId('campaign-recap-public-link');
    const publicRecapHref = await publicLink.getAttribute('href');
    expect(publicRecapHref).toBeTruthy();
    await expect(page.getByTestId('campaign-recap-copy-public-link-button')).toBeVisible();

    await submitActionButtonAndAssertRedirect(
      page,
      page.getByTestId('campaign-recap-mark-closed'),
      recapPath,
      'Planner mark closed failed',
    );
    await page.goto(recapPath);

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();

    try {
      await publicPage.goto(publicRecapHref!);
      await expect(publicPage.getByTestId('public-campaign-recap-page')).toBeVisible();
      await expect(publicPage.getByTestId('public-campaign-recap-title')).toContainText(campaignName);
      await expect(publicPage.getByText(closeoutNote)).toBeVisible();
    } finally {
      await publicContext.close();
    }

    await page.goto(roleHomePaths.planner);
    await page.getByLabel('Archive search').fill(campaignName);
    await page.getByLabel('Closeout state').selectOption('closed');
    await page.getByRole('button', { name: 'Apply archive filters' }).last().click();
    await expect(page.getByTestId('planner-recent-history')).toContainText(campaignName);
    await expect(page.getByTestId('planner-recent-history')).toContainText('Closed');
  } finally {
    await operatorContext.close();
    await driverContext.close();
  }
});
