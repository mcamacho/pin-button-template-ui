import { test, expect } from '@playwright/test';

// T011: Integration test application launch and canvas display
// Based on Quickstart Scenario 1: Basic Application Launch
test.describe('Application Launch', () => {
  test('should display Letter-sized canvas with default button areas', async ({ page }) => {
    // This test will fail until the application is implemented
    await page.goto('/');

    // Verify page loads without errors
    await expect(page).toHaveTitle(/Pin Button Layout Designer/);

    // Verify Letter-sized page canvas (8.5" x 11") is displayed
    const canvas = page.locator('[data-testid="canvas-container"]');
    await expect(canvas).toBeVisible();

    // Check canvas dimensions correspond to Letter size
    const canvasSize = await canvas.boundingBox();
    expect(canvasSize).toBeTruthy();

    // Verify aspect ratio matches Letter paper (8.5/11 = 0.773)
    if (canvasSize) {
      const aspectRatio = canvasSize.width / canvasSize.height;
      expect(aspectRatio).toBeCloseTo(0.773, 1);
    }
  });

  test('should show default circular button areas', async ({ page }) => {
    await page.goto('/');

    // Wait for application to initialize
    await page.waitForSelector('[data-testid="canvas-container"]');

    // Verify default circular button areas are present
    const buttonAreas = page.locator('[data-testid^="button-area"]');
    const buttonCount = await buttonAreas.count();

    // Should have optimal number of buttons arranged on page
    expect(buttonCount).toBeGreaterThan(0);
    expect(buttonCount).toBeLessThanOrEqual(20); // Max from requirements

    // Verify button areas are circular with 2.75" default diameter
    const firstButton = buttonAreas.first();
    await expect(firstButton).toBeVisible();
    await expect(firstButton).toHaveCSS('border-radius', '50%');
  });

  test('should display clean minimal interface with print button', async ({ page }) => {
    await page.goto('/');

    // Verify clean, minimal interface
    const header = page.locator('[data-testid="app-header"]');
    const sidebar = page.locator('[data-testid="sidebar"]');

    // Should not have cluttered UI
    await expect(page.locator('nav')).toHaveCount(0); // No complex navigation

    // Print button should be visible and accessible
    const printButton = page.locator('[data-testid="print-button"]');
    await expect(printButton).toBeVisible();
    await expect(printButton).toBeEnabled();
    await expect(printButton).toContainText(/print/i);

    // Verify print button is in accessible location (top area)
    const printButtonBox = await printButton.boundingBox();
    expect(printButtonBox).toBeTruthy();
    if (printButtonBox) {
      expect(printButtonBox.y).toBeLessThan(100); // Top area of viewport
    }
  });

  test('should show page outline clearly', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('[data-testid="canvas-container"]');
    await expect(canvas).toBeVisible();

    // Verify page has visible outline/border
    await expect(canvas).toHaveCSS('border-width', expect.stringMatching(/[1-9]/));

    // Should show page size indicator or ruler
    const pageInfo = page.locator('[data-testid="page-info"]');
    if (await pageInfo.count() > 0) {
      await expect(pageInfo).toContainText(/8\.5.*11|letter/i);
    }
  });

  test('should handle viewport resize gracefully', async ({ page }) => {
    await page.goto('/');

    // Test responsive behavior
    await page.setViewportSize({ width: 1200, height: 800 });
    const canvas1 = page.locator('[data-testid="canvas-container"]');
    await expect(canvas1).toBeVisible();

    await page.setViewportSize({ width: 800, height: 600 });
    const canvas2 = page.locator('[data-testid="canvas-container"]');
    await expect(canvas2).toBeVisible();

    // Canvas should maintain aspect ratio
    const canvasSize = await canvas2.boundingBox();
    if (canvasSize) {
      const aspectRatio = canvasSize.width / canvasSize.height;
      expect(aspectRatio).toBeCloseTo(0.773, 1);
    }
  });
});