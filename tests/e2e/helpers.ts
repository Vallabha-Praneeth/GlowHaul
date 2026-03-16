import type { Locator, Page } from '@playwright/test';

export async function requestSubmit(form: Locator) {
  await form.evaluate((node) => {
    (node as HTMLFormElement).requestSubmit();
  });
}

export async function setTextControlValue(control: Locator, value: string) {
  await control.evaluate(
    (node, nextValue) => {
      const field = node as HTMLInputElement | HTMLTextAreaElement;
      field.focus();
      field.value = nextValue;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value,
  );
}

export async function submitActionButtonAndAssertRedirect(
  page: Page,
  button: Locator,
  path: string,
  failurePrefix: string,
) {
  await Promise.all([
    page.waitForURL((url) => url.pathname === path && (url.searchParams.has('notice') || url.searchParams.has('error')), {
      timeout: 60_000,
    }),
    button.click(),
  ]);

  const url = new URL(page.url());
  if (url.searchParams.has('error')) {
    throw new Error(`${failurePrefix}: ${url.searchParams.get('error') ?? 'Unknown error'}`);
  }

  await page.goto(path);
}

type WaitForRouteValueOptions<T> = {
  description: string;
  intervalMs?: number;
  page: Page;
  path: string;
  read: () => Promise<T>;
  refreshMode?: 'goto' | 'none';
  timeoutMs?: number;
  until: (value: T) => boolean;
};

export async function waitForRouteValue<T>({
  description,
  intervalMs = 1_500,
  page,
  path,
  read,
  refreshMode = 'none',
  timeoutMs = 60_000,
  until,
}: WaitForRouteValueOptions<T>): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastValue: T | undefined;
  let hasReadCurrentPage = false;

  while (Date.now() < deadline) {
    const currentUrl = page.url();
    const currentPath =
      currentUrl && currentUrl !== 'about:blank'
        ? new URL(currentUrl).pathname
        : null;

    const shouldNavigate =
      currentPath !== path || (refreshMode === 'goto' && hasReadCurrentPage);

    if (shouldNavigate) {
      await page.goto(path);
    }

    lastValue = await read();
    hasReadCurrentPage = true;

    if (until(lastValue)) {
      return lastValue;
    }

    await page.waitForTimeout(intervalMs);
  }

  throw new Error(`Timed out waiting for ${description}. Last observed value: ${JSON.stringify(lastValue)}`);
}

export async function waitForNotification(
  page: Page,
  path: string,
  expectedText: string,
  timeoutMs = 60_000,
) {
  await waitForRouteValue({
    description: `notification ${expectedText}`,
    intervalMs: 2_000,
    page,
    path,
    refreshMode: 'goto',
    timeoutMs,
    read: async () => {
      const notificationCenter = page.getByTestId('notification-center');

      if (await notificationCenter.count() === 0) {
        return '';
      }

      return (await notificationCenter.textContent()) ?? '';
    },
    until: (text) => text.includes(expectedText),
  });
}
