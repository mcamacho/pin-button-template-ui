import { test, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// T012: Integration test image drag and drop functionality
// Based on Quickstart Scenario 2: Image Drag and Drop
test.describe('Image Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="canvas-container"]');
  });

  test('should accept image file drop on button area', async ({ page }) => {
    // Create a test image file for drag and drop
    const testImagePath = join(__dirname, '../fixtures/test-image.png');

    // Get first button area
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await expect(buttonArea).toBeVisible();

    // Simulate file drop
    const fileChooserPromise = page.waitForEvent('filechooser');

    // Since Playwright doesn't support direct drag-drop from file system,
    // we'll trigger the file input that would be activated by drop
    await buttonArea.click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);

    // Verify image appears within circular boundary
    const buttonImage = buttonArea.locator('img, canvas');
    await expect(buttonImage).toBeVisible({ timeout: 5000 });

    // Verify circular masking is applied
    await expect(buttonArea).toHaveCSS('border-radius', '50%');
    await expect(buttonArea).toHaveCSS('overflow', 'hidden');
  });

  test('should show visual feedback during drag operation', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();

    // Simulate drag over
    await buttonArea.hover();
    await page.mouse.down();

    // Verify visual feedback (drag-over state)
    await expect(buttonArea).toHaveClass(/drag-over|drop-zone-active/);

    await page.mouse.up();

    // Feedback should be removed
    await expect(buttonArea).not.toHaveClass(/drag-over|drop-zone-active/);
  });

  test('should maintain aspect ratio with circular masking', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();

    // Upload a rectangular image
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = join(__dirname, '../fixtures/rectangular-image.jpg');

    await fileInput.setInputFiles(testImagePath);

    // Wait for image to load
    await page.waitForTimeout(1000);

    const buttonImage = buttonArea.locator('img, canvas');
    await expect(buttonImage).toBeVisible();

    // Verify the container is still circular
    const buttonBox = await buttonArea.boundingBox();
    expect(buttonBox).toBeTruthy();

    if (buttonBox) {
      // Should be square (circular container)
      expect(Math.abs(buttonBox.width - buttonBox.height)).toBeLessThan(5);
    }

    // Image should be cropped to fit circle
    await expect(buttonArea).toHaveCSS('border-radius', '50%');
  });

  test('should position image optimally for cropping', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    const testImagePath = join(__dirname, '../fixtures/test-image.png');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    // Verify image is centered by default (crop 0.5, 0.5)
    const buttonImage = buttonArea.locator('img, canvas');
    const imageBox = await buttonImage.boundingBox();
    const containerBox = await buttonArea.boundingBox();

    if (imageBox && containerBox) {
      // Image should be centered in container
      const imageCenterX = imageBox.x + imageBox.width / 2;
      const imageCenterY = imageBox.y + imageBox.height / 2;
      const containerCenterX = containerBox.x + containerBox.width / 2;
      const containerCenterY = containerBox.y + containerBox.height / 2;

      expect(Math.abs(imageCenterX - containerCenterX)).toBeLessThan(10);
      expect(Math.abs(imageCenterY - containerCenterY)).toBeLessThan(10);
    }
  });

  test('should preserve image quality after drop', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    const testImagePath = join(__dirname, '../fixtures/high-quality-image.png');

    // Upload high-quality image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await page.waitForTimeout(1000);

    const buttonImage = buttonArea.locator('img, canvas');
    await expect(buttonImage).toBeVisible();

    // Verify image is not overly compressed
    // Check that the image element has reasonable dimensions
    const imageBox = await buttonImage.boundingBox();
    expect(imageBox).toBeTruthy();

    if (imageBox) {
      expect(imageBox.width).toBeGreaterThan(50);
      expect(imageBox.height).toBeGreaterThan(50);
    }

    // Verify image loading completed successfully
    const imageLoadError = page.locator('[data-testid="image-load-error"]');
    await expect(imageLoadError).toHaveCount(0);
  });

  test('should reject unsupported file types', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();

    // Try to upload a text file
    const textFilePath = join(__dirname, '../fixtures/test-file.txt');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(textFilePath);

    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/unsupported.*format|invalid.*file/i);

    // Button area should remain empty
    const buttonImage = buttonArea.locator('img, canvas');
    await expect(buttonImage).toHaveCount(0);
  });

  test('should handle large files appropriately', async ({ page }) => {
    const buttonArea = page.locator('[data-testid^="button-area"]').first();

    // Simulate large file (this would be a real large test file in practice)
    const largFilePath = join(__dirname, '../fixtures/large-image.jpg');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largFilePath);

    // Should show loading indicator for large files
    // Loading indicator might appear briefly

    await page.waitForTimeout(2000);

    // Eventually should load or show size warning
    const buttonImage = buttonArea.locator('img, canvas');
    const errorMessage = page.locator('[data-testid="error-message"]');

    const imageLoaded = await buttonImage.count() > 0;
    const errorShown = await errorMessage.count() > 0;

    // Either image loads successfully or error is shown for size limit
    expect(imageLoaded || errorShown).toBe(true);

    if (errorShown) {
      await expect(errorMessage).toContainText(/file.*too.*large|size.*limit/i);
    }
  });
});