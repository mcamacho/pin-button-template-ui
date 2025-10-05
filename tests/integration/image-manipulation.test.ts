import { test, expect } from '@playwright/test';

// T014: Integration test image manipulation (crop, zoom, rotate)
test.describe('Image Manipulation', () => {
  test('should manipulate image in real-time preview', async ({ page }) => {
    await page.goto('/');
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');
    await expect(modal).toBeVisible();

    // Test crop adjustment
    const cropXControl = modal.locator('[data-testid="crop-x-control"]');
    await cropXControl.fill('0.3');

    // Test zoom adjustment
    const zoomControl = modal.locator('[data-testid="zoom-control"]');
    await zoomControl.fill('2.0');

    // Test rotation
    const rotationControl = modal.locator('[data-testid="rotation-control"]');
    await rotationControl.fill('45');

    // Verify preview updates
    const preview = modal.locator('[data-testid="image-preview"]');
    await expect(preview).toBeVisible();
  });
});