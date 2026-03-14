import { expect, test } from '../fixtures';
import { requestSubmit, setTextControlValue, submitActionButtonAndAssertRedirect, waitForRouteValue } from '../helpers';
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
    refreshMode: 'goto',
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
  const issueNote = `Street festival detour ${Date.now()}`;
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
    await submitActionButtonAndAssertRedirect(
      operatorPage,
      incomingOfferCard.getByRole('button', { name: 'Accept and book slot' }),
      roleHomePaths.operator,
      'Operator planner-offer acceptance failed',
    );
    await refreshOperatorCampaign(operatorPage, campaignName);

    const operatorActiveCampaign = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await expect(operatorActiveCampaign).toBeVisible();
    await operatorActiveCampaign.getByLabel('Assigned driver').selectOption('33333333-3333-3333-3333-333333333333');
    await operatorActiveCampaign.getByLabel('Booking status').selectOption('in_progress');
    await operatorActiveCampaign.getByLabel('Run status').selectOption('en_route');
    await submitActionButtonAndAssertRedirect(
      operatorPage,
      operatorActiveCampaign.getByRole('button', { name: 'Save dispatch plan' }),
      roleHomePaths.operator,
      'Operator planner dispatch save failed',
    );
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

    await setTextControlValue(getDriverRunCard().getByTestId(/driver-issue-note-/), issueNote);
    await submitActionButtonAndAssertRedirect(
      driverPage,
      getDriverRunCard().getByTestId(/driver-report-issue-button-/),
      roleHomePaths.driver,
      'Driver issue report failed',
    );
    await waitForRouteValue({
      description: `driver issue for ${campaignName}`,
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
      until: (text) => text.includes('Issue') && text.includes(issueNote),
    });

    await page.goto(roleHomePaths.planner);
    const issueOffer = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(issueOffer).toContainText('Issue', { timeout: 15_000 });
    await expect(issueOffer).toContainText(issueNote, { timeout: 15_000 });
    await expect(page.getByTestId('planner-attention-queue')).toContainText(campaignName, { timeout: 15_000 });
    await expect(page.getByTestId('planner-attention-queue')).toContainText(issueNote, { timeout: 15_000 });

    await operatorPage.goto(roleHomePaths.operator);
    const issueCampaignCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await submitActionButtonAndAssertRedirect(
      operatorPage,
      issueCampaignCard.getByRole('button', { name: 'Resolve issue' }),
      roleHomePaths.operator,
      'Operator planner issue resolve failed',
    );

    await waitForRouteValue({
      description: `driver resume for ${campaignName}`,
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
      until: (text) => text.includes('En Route') && text.includes(issueNote),
    });

    await operatorPage.goto(roleHomePaths.operator);
    const liveCampaignCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await liveCampaignCard.getByLabel('Run status').selectOption('live');
    await submitActionButtonAndAssertRedirect(
      operatorPage,
      liveCampaignCard.getByRole('button', { name: 'Save dispatch plan' }),
      roleHomePaths.operator,
      'Operator planner live dispatch save failed',
    );

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
      until: (text) => text.includes('Live') && text.includes(issueNote),
    });

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

    await page.goto(roleHomePaths.planner);
    const proofVisibleOffer = page.getByTestId('planner-submitted-offers-list').locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(proofVisibleOffer).toContainText('Uploaded', { timeout: 15_000 });
    await expect(proofVisibleOffer).toContainText('proof logged', { timeout: 15_000 });
    await expect(page.getByTestId('planner-attention-queue')).toContainText('Wait for approval', { timeout: 15_000 });
    await expect(proofVisibleOffer.getByRole('link', { name: 'Open recap' })).toBeVisible();

    await Promise.all([
      page.waitForURL((url) => url.pathname.startsWith('/campaigns/'), { timeout: 30_000 }),
      proofVisibleOffer.getByRole('link', { name: 'Open recap' }).click(),
    ]);

    await expect(page.getByTestId('campaign-recap-page')).toBeVisible();
    await expect(page.getByTestId('campaign-recap-title')).toContainText(campaignName);
    await expect(page.getByTestId('campaign-recap-summary')).toContainText(issueNote);
    await expect(page.getByTestId('campaign-recap-proof-list')).toContainText(proofFileName);
    await expect(page.getByTestId('campaign-recap-timeline')).toContainText('Proof Uploaded');
    await expect(page.getByTestId('campaign-recap-actions')).toBeVisible();
    await expect(page.getByTestId('campaign-recap-print-button')).toBeVisible();
    await expect(page.getByTestId('campaign-recap-copy-link-button')).toBeVisible();
    await expect(page.getByTestId('campaign-recap-native-share-button')).toBeVisible();
    await expect(page.getByTestId('campaign-recap-share-policy')).toContainText(
      'Use Print / Save PDF for client-safe distribution.',
    );
  } finally {
    await operatorContext.close();
    await driverContext.close();
  }
});
