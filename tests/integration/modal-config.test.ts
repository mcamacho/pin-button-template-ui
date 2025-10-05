import { test, expect } from '@playwright/test';

// T013: Integration test configuration modal workflow
// Based on Quickstart Scenario 3: Configuration Modal
test.describe('Configuration Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="canvas-container"]');
  });

  test('should open modal when clicking button area', async ({ page }) => {
    // Get first button area
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await expect(buttonArea).toBeVisible();

    // Click button area
    await buttonArea.click();

    // Modal should open
    const modal = page.locator('[data-testid="config-modal"]');
    await expect(modal).toBeVisible();

    // Modal should have expected controls
    await expect(modal.locator('[data-testid="diameter-control"]')).toBeVisible();
    await expect(modal.locator('[data-testid="crop-controls"]')).toBeVisible();
    await expect(modal.locator('[data-testid="zoom-control"]')).toBeVisible();
    await expect(modal.locator('[data-testid="rotation-control"]')).toBeVisible();
  });

  test('should allow button size adjustment (0.5" - 4.0")', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');
    await expect(modal).toBeVisible();

    const diameterControl = modal.locator('[data-testid="diameter-control"]');

    // Test minimum size (0.5")
    await diameterControl.fill('0.5');
    const minValue = await diameterControl.inputValue();
    expect(parseFloat(minValue)).toBeGreaterThanOrEqual(0.5);

    // Test maximum size (4.0")
    await diameterControl.fill('4.0');
    const maxValue = await diameterControl.inputValue();
    expect(parseFloat(maxValue)).toBeLessThanOrEqual(4.0);

    // Test invalid values
    await diameterControl.fill('0.3'); // Below minimum
    await page.keyboard.press('Tab'); // Trigger validation

    // Should show validation error or auto-correct
    const errorMsg = modal.locator('[data-testid="diameter-error"]');
    if (await errorMsg.count() > 0) {
      await expect(errorMsg).toBeVisible();
    } else {
      // Auto-corrected to minimum
      const correctedValue = await diameterControl.inputValue();
      expect(parseFloat(correctedValue)).toBeGreaterThanOrEqual(0.5);
    }
  });

  test('should support image upload as alternative', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');
    await expect(modal).toBeVisible();

    // Should have image upload section
    const uploadSection = modal.locator('[data-testid="image-upload"]');
    await expect(uploadSection).toBeVisible();

    // Should have file input or upload button
    const uploadButton = modal.locator('[data-testid="upload-button"], input[type="file"]');
    await expect(uploadButton).toBeVisible();

    // Should have remove image option if image exists
    const removeButton = modal.locator('[data-testid="remove-image"]');
    // Remove button visibility depends on whether image is loaded
  });

  test('should adjust zoom level (0.1x - 5.0x)', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');
    const zoomControl = modal.locator('[data-testid="zoom-control"]');

    // Test minimum zoom
    await zoomControl.fill('0.1');
    const minZoom = await zoomControl.inputValue();
    expect(parseFloat(minZoom)).toBeGreaterThanOrEqual(0.1);

    // Test maximum zoom
    await zoomControl.fill('5.0');
    const maxZoom = await zoomControl.inputValue();
    expect(parseFloat(maxZoom)).toBeLessThanOrEqual(5.0);

    // Test default zoom
    await zoomControl.fill('1.0');
    const defaultZoom = await zoomControl.inputValue();
    expect(parseFloat(defaultZoom)).toBe(1.0);
  });

  test('should save changes and persist', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');

    // Make changes
    await modal.locator('[data-testid="diameter-control"]').fill('3.0');
    await modal.locator('[data-testid="zoom-control"]').fill('1.5');

    // Save changes
    const saveButton = modal.locator('[data-testid="save-button"]');
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Changes should be visible in button area
    // Button area should be larger (3.0" vs default 2.75")
    const buttonSize = await buttonArea.boundingBox();
    expect(buttonSize).toBeTruthy();

    // Reopen modal to verify persistence
    await buttonArea.click();
    await expect(modal).toBeVisible();

    const diameterValue = await modal.locator('[data-testid="diameter-control"]').inputValue();
    expect(parseFloat(diameterValue)).toBe(3.0);

    const zoomValue = await modal.locator('[data-testid="zoom-control"]').inputValue();
    expect(parseFloat(zoomValue)).toBe(1.5);
  });

  test('should cancel changes without applying', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');

    // Get original values
    const originalDiameter = await modal.locator('[data-testid="diameter-control"]').inputValue();

    // Make changes
    await modal.locator('[data-testid="diameter-control"]').fill('3.5');

    // Cancel changes
    const cancelButton = modal.locator('[data-testid="cancel-button"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Reopen and verify no changes were applied
    await buttonArea.click();
    await expect(modal).toBeVisible();

    const currentDiameter = await modal.locator('[data-testid="diameter-control"]').inputValue();
    expect(currentDiameter).toBe(originalDiameter);
  });

  test('should close modal with escape key', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    const modal = page.locator('[data-testid="config-modal"]');
    await expect(modal).toBeVisible();

    // Press escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(modal).not.toBeVisible();
  });
});