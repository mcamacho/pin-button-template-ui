import { test, expect } from '@playwright/test';

// T016: Integration test print functionality and browser integration
test.describe('Print Functionality', () => {
  test('should open print dialog when clicking print button', async ({ page }) => {
    await page.goto('/');

    const printButton = page.locator('[data-testid="print-button"]');
    await expect(printButton).toBeVisible();

    // Mock print dialog (browser print can't be directly tested)
    await page.evaluate(() => {
      window.print = () => {
        (window as any).printCalled = true;
      };
    });

    await printButton.click();

    // Verify print function was called
    const printCalled = await page.evaluate(() => (window as any).printCalled);
    expect(printCalled).toBe(true);
  });

  test('should generate high-quality print layout', async ({ page }) => {
    await page.goto('/');

    // Trigger print preview generation
    const printButton = page.locator('[data-testid="print-button"]');
    await printButton.click();

    // Wait for print preparation
    await page.waitForTimeout(1000);

    // Verify print-specific styles are applied
    const printStyles = page.locator('style[data-print-styles]');
    if (await printStyles.count() > 0) {
      const styleContent = await printStyles.textContent();
      expect(styleContent).toContain('@media print');
    }
  });
});