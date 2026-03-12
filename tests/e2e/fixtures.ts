import { expect as baseExpect, test as base } from '@playwright/test';

export type DemoRole = 'operator' | 'planner' | 'driver';

type RoleFixtures = {
  gotoRoleHome: () => Promise<void>;
};

type RoleOptions = {
  role: DemoRole;
};

export const authFiles: Record<DemoRole, string> = {
  driver: 'tests/e2e/.auth/driver.json',
  operator: 'tests/e2e/.auth/operator.json',
  planner: 'tests/e2e/.auth/planner.json',
};

export const hostedAuthFiles: Record<DemoRole, string> = {
  driver: 'tests/e2e/.auth/hosted-driver.json',
  operator: 'tests/e2e/.auth/hosted-operator.json',
  planner: 'tests/e2e/.auth/hosted-planner.json',
};

export const roleHomePaths: Record<DemoRole, string> = {
  driver: '/driver',
  operator: '/operator',
  planner: '/planner/search',
};

export const hostedDemoEmails: Record<DemoRole, string> = {
  driver: 'driver.demo@glowhaul.app',
  operator: 'operator.demo@glowhaul.app',
  planner: 'planner.demo@glowhaul.app',
};

export const roleLandingText: Record<DemoRole, string> = {
  driver: 'Execute runs without call-chain chaos.',
  operator: 'Texas fleet, one control room.',
  planner: 'Search mobile inventory fast.',
};

export const roleDemoButtonLabels: Record<DemoRole, string> = {
  driver: 'Continue as driver demo',
  operator: 'Continue as operator demo',
  planner: 'Continue as planner demo',
};

export async function signInAsDemoRole(page: import('@playwright/test').Page, role: DemoRole) {
  await page.goto('/login');
  await page.getByRole('button', { name: roleDemoButtonLabels[role] }).click();
  await baseExpect(page).toHaveURL(new RegExp(`${roleHomePaths[role].replace('/', '\\/')}$`));
  await baseExpect(page.getByText(roleLandingText[role])).toBeVisible();
}

export async function signOut(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await baseExpect(page).toHaveURL(/\/login$/);
}

export const test = base.extend<RoleOptions & RoleFixtures>({
  role: ['operator', { option: true }],
  gotoRoleHome: async ({ page, role }, use) => {
    await use(async () => {
      await page.goto(roleHomePaths[role]);
      await baseExpect(page).toHaveURL(new RegExp(`${roleHomePaths[role].replace('/', '\\/')}$`));
      await baseExpect(page.getByText(roleLandingText[role])).toBeVisible();
    });
  },
});

export const expect = baseExpect;
