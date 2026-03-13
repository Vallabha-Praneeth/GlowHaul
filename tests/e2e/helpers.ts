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

  while (Date.now() < deadline) {
    const currentUrl = page.url();
    const currentPath =
      currentUrl && currentUrl !== 'about:blank'
        ? new URL(currentUrl).pathname
        : null;

    if (currentPath !== path || refreshMode === 'goto') {
      await page.goto(path);
    }

    lastValue = await read();

    if (until(lastValue)) {
      return lastValue;
    }

    await page.waitForTimeout(intervalMs);
  }

  throw new Error(`Timed out waiting for ${description}. Last observed value: ${JSON.stringify(lastValue)}`);
}
