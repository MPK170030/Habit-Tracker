import { test, expect } from '@playwright/test';

// These tests run against the live URL (PLAYWRIGHT_BASE_URL env var overrides).
// The demo account (demo@warrior.dev / demo1234) is seeded at deployment.

test.describe('Demo login', () => {
  test('Try Demo Account button logs in without typing credentials', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Warrior Habits' })).toBeVisible();

    await page.getByRole('button', { name: 'Try Demo Account' }).click();

    await expect(page.getByText("Today's Quests")).toBeVisible({ timeout: 10_000 });
  });

  test('demo account lands on the main app with the warrior card visible', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    await expect(page.getByText("Today's Quests")).toBeVisible({ timeout: 10_000 });

    // Warrior card: XP total and streak should be present
    await expect(page.getByText(/XP total/)).toBeVisible();
    await expect(page.getByText(/\d+ day/)).toBeVisible();
  });

  test('demo account has the pre-seeded habits', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    await expect(page.getByText("Today's Quests")).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText('Morning Run')).toBeVisible();
    await expect(page.getByText('Read 30 min')).toBeVisible();
    await expect(page.getByText('Meditate')).toBeVisible();
    await expect(page.getByText('Drink Water')).toBeVisible();
  });
});

test.describe('Habit interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    await expect(page.getByText("Today's Quests")).toBeVisible({ timeout: 10_000 });
  });

  test('toggling a habit row flips its checked state', async ({ page }) => {
    const habitRow = page.getByRole('button').filter({ hasText: 'Morning Run' });

    // The SVG checkmark is only rendered when the habit is checked
    const checkedBefore = (await habitRow.locator('svg').count()) > 0;

    await habitRow.click();
    await page.waitForTimeout(300); // let optimistic update render

    const checkedAfter = (await habitRow.locator('svg').count()) > 0;
    expect(checkedAfter).toBe(!checkedBefore);
  });

  test('manage panel opens and closes', async ({ page }) => {
    await page.getByRole('button', { name: /Manage/ }).click();
    await expect(page.getByText('Manage Quests')).toBeVisible();

    // Close by clicking the backdrop
    await page.locator('.fixed.inset-0').first().click();
    await expect(page.getByText('Manage Quests')).not.toBeVisible();
  });

  test('can add a new habit from the manage panel', async ({ page }) => {
    await page.getByRole('button', { name: /Manage/ }).click();
    await expect(page.getByText('Manage Quests')).toBeVisible();

    const input = page.getByPlaceholder('Quest name…');
    await input.fill('E2E Test Habit');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('E2E Test Habit')).toBeVisible();

    // Clean up: schedule it for removal
    const row = page.locator('div').filter({ hasText: /^💪E2E Test Habit/ }).last();
    await row.getByRole('button', { name: '×' }).click();
  });
});
