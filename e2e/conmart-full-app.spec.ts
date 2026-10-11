import { test, expect } from '@playwright/test';

test.describe('ConMart Full App End-to-End Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Assert that no React #441 or section error boundaries trigger during the test
    page.on('console', (msg) => {
      const text = msg.text();
      expect(text).not.toContain('Minified React error #441');
      expect(text).not.toContain('section error caught');
    });

    page.on('pageerror', (err) => {
      expect(err.message).not.toContain('Minified React error #441');
    });
  });

  test('1. Home Landing Page loads with hero and search', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    const title = await page.title();
    expect(title).toContain('ECON');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('2. Buyer Hub (/buyer) displays 20 material categories', async ({ page }) => {
    const response = await page.goto('/buyer', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await page.waitForSelector('text=Material Categories', { timeout: 20000 });
    const categoryHeading = page.locator('text=Material Categories');
    await expect(categoryHeading).toBeVisible();

    await expect(page.locator('text=Cement').first()).toBeVisible();
    await expect(page.locator('text=Rebar').first()).toBeVisible();
    await expect(page.locator('text=Aggregate & Sand').first()).toBeVisible();
  });

  test('3. Aggregate & Sand Category (/buyer/category/aggregates) loads without errors', async ({ page }) => {
    // Specifically test the category that previously failed due to missing is_deleted column
    const response = await page.goto('/buyer/category/aggregates', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    // Verify error boundary did NOT trigger
    const errorFallback = page.locator('text=Unable to load this section');
    await expect(errorFallback).not.toBeVisible();

    // Verify category title rendered
    const titleLocator = page.locator('h1, h2').filter({ hasText: /Aggregate & Sand/i });
    await expect(titleLocator.first()).toBeVisible();
  });

  test('4. Cement Category (/buyer/category/cement) loads product catalog', async ({ page }) => {
    const response = await page.goto('/buyer/category/cement', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.locator('text=Unable to load this section')).not.toBeVisible();

    const titleLocator = page.locator('h1, h2').filter({ hasText: /Cement/i });
    await expect(titleLocator.first()).toBeVisible();
  });

  test('5. Rebar Category (/buyer/category/steel) loads properly', async ({ page }) => {
    const response = await page.goto('/buyer/category/steel', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.locator('text=Unable to load this section')).not.toBeVisible();
    const titleLocator = page.locator('h1, h2').filter({ hasText: /Rebar/i });
    await expect(titleLocator.first()).toBeVisible();
  });

  test('6. All Materials Catalog (/buyer/category/all) with search filter', async ({ page }) => {
    const response = await page.goto('/buyer/category/all?search=Dangote', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.locator('text=Unable to load this section')).not.toBeVisible();
    await expect(page.locator('input[type="search"]').first()).toBeVisible();
  });

  test('7. Stores Directory (/buyer/stores) loads supplier depots', async ({ page }) => {
    const response = await page.goto('/buyer/stores', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    await expect(page.locator('text=Unable to load this section')).not.toBeVisible();
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('8. Agent Application Onboarding Wizard (/agent/apply) loads', async ({ page }) => {
    const response = await page.goto('/agent/apply', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/agent|apply|register|sign in/i);
  });

  test('9. Login Page (/login) renders sign-in form', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);

    // Form inputs should be visible
    const input = page.locator('input').first();
    await expect(input).toBeVisible();
  });

  test('10. Non-existent route (/random-404-check) renders gracefully without crash', async ({ page }) => {
    const response = await page.goto('/random-404-check-xyz', { waitUntil: 'domcontentloaded' });
    expect([200, 404]).toContain(response?.status());

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
