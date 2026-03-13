import { expect, test } from '../fixtures';
import { requestSubmit, setTextControlValue, waitForRouteValue } from '../helpers';
import { authFiles, roleHomePaths } from '../fixtures';

test.use({ role: 'driver', storageState: 'tests/e2e/.auth/driver.json' });

async function refreshOperatorSlot(page: import('@playwright/test').Page, slotNote: string) {
  await waitForRouteValue({
    description: `operator slot ${slotNote}`,
    page,
    path: roleHomePaths.operator,
    refreshMode: 'goto',
    read: async () => page.locator('form.surface').filter({ hasText: slotNote }).count(),
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

async function refreshDriverRunCardUntil(
  page: import('@playwright/test').Page,
  campaignName: string,
  expectedText: string,
  refreshMode: 'goto' | 'none' = 'none',
  timeout = 60_000,
) {
  await waitForRouteValue({
    description: `driver run card ${campaignName}`,
    intervalMs: 2_000,
    page,
    path: roleHomePaths.driver,
    refreshMode,
    timeoutMs: timeout,
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

async function submitDriverActionForm(page: import('@playwright/test').Page, button: import('@playwright/test').Locator) {
  await Promise.all([
    page.waitForURL(/\/driver\?(notice|error)=/, { timeout: 60_000 }),
    button.click(),
  ]);

  const url = new URL(page.url());
  if (url.searchParams.has('error')) {
    throw new Error(`Driver action failed: ${decodeURIComponent(url.searchParams.get('error') ?? 'Unknown error')}`);
  }

  await page.goto(roleHomePaths.driver);
}

test('driver can upload proof into Supabase storage and receive operator review live', async ({ browser, page, gotoRoleHome }) => {
  test.slow();
  const fileName = `proof-${Date.now()}.jpg`;
  const reviewNote = `Approved for client share ${Date.now()}`;
  const operatorContext = await browser.newContext({ storageState: authFiles.operator });
  const operatorPage = await operatorContext.newPage();

  try {
    await gotoRoleHome();
    await expect(page.getByTestId('live-sync-badge')).toBeVisible();

    const uploadInput = page.getByTestId(/driver-proof-file-input-/).first();
    await uploadInput.setInputFiles({
      buffer: Buffer.from('fake-jpeg-proof'),
      mimeType: 'image/jpeg',
      name: fileName,
    });
    await page.getByTestId(/driver-proof-upload-button-/).first().click();
    await waitForRouteValue({
      description: `driver proof upload ${fileName}`,
      intervalMs: 2_000,
      page,
      path: roleHomePaths.driver,
      timeoutMs: 60_000,
      read: async () => page.locator('div.pill').filter({ hasText: fileName }).count(),
      until: (count) => count === 1,
    });

    await operatorPage.goto(roleHomePaths.operator);
    const proofCard = operatorPage.locator('form.surface').filter({ hasText: fileName }).first();
    await setTextControlValue(proofCard.getByLabel('Review note'), reviewNote);
    await proofCard.getByRole('button', { name: 'Approve proof' }).click();

    await expect.poll(async () => {
      await page.goto(roleHomePaths.driver);
      const driverProofCard = page.locator('div.pill').filter({ hasText: fileName }).first();

      if (await driverProofCard.count() === 0) {
        return '';
      }

      return (await driverProofCard.textContent()) ?? '';
    }, { timeout: 30_000 }).toContain('Approved');
    await expect(page.locator('div.pill').filter({ hasText: fileName }).first()).toContainText(reviewNote, { timeout: 30_000 });
    await expect(page.locator('div.pill').filter({ hasText: fileName }).first()).toContainText('Approved proof is ready for planner share.', { timeout: 30_000 });
    await expect(page.locator('div.pill').filter({ hasText: fileName }).first().getByTestId(/driver-proof-open-file-/)).toBeVisible();
  } finally {
    await operatorContext.close();
  }
});

test('driver can report an issue and resume after operator recovery', async ({ browser, page, gotoRoleHome }) => {
  test.setTimeout(180_000);
  const slotNote = `Driver execution slot ${Date.now()}`;
  const offerMessage = `Driver execution offer ${Date.now()}`;
  const campaignName = `Driver execution campaign ${Date.now()}`;
  const issueNote = `Unexpected road closure ${Date.now()}`;
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
    await setTextControlValue(createForm.getByLabel('Campaign notes'), slotNote);
    await requestSubmit(createForm);
    await refreshOperatorSlot(operatorPage, slotNote);

    await plannerPage.goto(roleHomePaths.planner);
    const marketplaceCard = plannerPage.locator('div.surface').filter({ hasText: slotNote }).first();
    await marketplaceCard.getByLabel('Offer amount (USD)').fill('3650');
    await setTextControlValue(marketplaceCard.getByLabel('Offer note'), offerMessage);
    await marketplaceCard.getByRole('button', { name: 'Submit offer' }).click();

    await refreshOperatorOffer(operatorPage, offerMessage);
    const incomingOfferCard = operatorPage.locator('div.surface').filter({ hasText: offerMessage }).first();
    await setTextControlValue(incomingOfferCard.getByLabel('Campaign name'), campaignName);
    await incomingOfferCard.getByRole('button', { name: 'Accept and book slot' }).click();
    await refreshOperatorCampaign(operatorPage, campaignName);

    const dispatchCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await dispatchCard.getByLabel('Assigned driver').selectOption('33333333-3333-3333-3333-333333333333');
    await dispatchCard.getByLabel('Booking status').selectOption('in_progress');
    await dispatchCard.getByLabel('Run status').selectOption('en_route');
    await dispatchCard.getByRole('button', { name: 'Save dispatch plan' }).click();
    await waitForRouteValue({
      description: `operator dispatch assignment ${campaignName}`,
      intervalMs: 2_000,
      page: operatorPage,
      path: roleHomePaths.operator,
      refreshMode: 'goto',
      timeoutMs: 60_000,
      read: async () => {
        const card = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
        if (await card.count() === 0) {
          return '';
        }
        return await card.locator('select[name="driverId"]').inputValue();
      },
      until: (value) => value === '33333333-3333-3333-3333-333333333333',
    });

    await gotoRoleHome();
    const getRunCard = () => page.locator('div.surface').filter({ hasText: campaignName }).first();
    await refreshDriverRunCardUntil(page, campaignName, 'En Route', 'goto');
    await expect(getRunCard().getByText('En Route', { exact: true }).first()).toBeVisible();

    await setTextControlValue(getRunCard().getByTestId(/driver-issue-note-/), issueNote);
    await submitDriverActionForm(page, getRunCard().getByTestId(/driver-report-issue-button-/));
    await refreshDriverRunCardUntil(page, campaignName, 'Issue', 'goto');
    await expect(getRunCard()).toContainText(issueNote);

    await operatorPage.goto(roleHomePaths.operator);
    const issueCampaignCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await expect(issueCampaignCard).toContainText(issueNote);
    await issueCampaignCard.getByRole('button', { name: 'Resolve issue' }).click();

    await refreshDriverRunCardUntil(page, campaignName, 'En Route', 'goto');
    await expect(getRunCard()).toContainText(issueNote);

    await operatorPage.goto(roleHomePaths.operator);
    const liveCampaignCard = operatorPage.locator('form.surface').filter({ hasText: campaignName }).first();
    await liveCampaignCard.getByLabel('Run status').selectOption('live');
    await liveCampaignCard.getByRole('button', { name: 'Save dispatch plan' }).click();

    await refreshDriverRunCardUntil(page, campaignName, 'Live', 'goto');
    await expect(getRunCard().getByText('Upload at least one proof file before completing this run.')).toBeVisible();

    const uploadInput = getRunCard().getByTestId(/driver-proof-file-input-/);
    await uploadInput.setInputFiles({
      buffer: Buffer.from('driver-execution-proof'),
      mimeType: 'image/jpeg',
      name: proofFileName,
    });
    await getRunCard().getByTestId(/driver-proof-upload-button-/).click();
    await waitForRouteValue({
      description: `driver proof upload ${proofFileName}`,
      intervalMs: 2_000,
      page,
      path: roleHomePaths.driver,
      timeoutMs: 60_000,
      read: async () => page.locator('div.pill').filter({ hasText: proofFileName }).count(),
      until: (count) => count === 1,
    });

    await expect(getRunCard()).toContainText('Proof uploaded. Waiting for operator review.');

    await plannerPage.goto(roleHomePaths.planner);
    const completedOffer = plannerPage.locator('div.pill').filter({ hasText: campaignName }).first();
    await expect(completedOffer).toContainText(`Execution: Live`, { timeout: 15_000 });
    await expect(completedOffer).toContainText(issueNote, { timeout: 15_000 });
    await expect(completedOffer).toContainText('Uploaded', { timeout: 15_000 });
  } finally {
    await operatorContext.close();
    await plannerContext.close();
  }
});
