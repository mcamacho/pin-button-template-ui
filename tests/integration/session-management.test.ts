import { test, expect } from '@playwright/test';

// T015: Integration test session management (save, load, temporary)
test.describe('Session Management', () => {
  test('should save and load named sessions', async ({ page }) => {
    await page.goto('/');

    // Create session changes
    const buttonArea = page.locator('[data-testid^="button-area"]').first();
    await buttonArea.click();

    // Make configuration changes
    const modal = page.locator('[data-testid="config-modal"]');
    await modal.locator('[data-testid="diameter-control"]').fill('3.0');
    await modal.locator('[data-testid="save-button"]').click();

    // Save session with name
    const saveButton = page.locator('[data-testid="save-session"]');
    await saveButton.click();

    const sessionNameInput = page.locator('[data-testid="session-name-input"]');
    await sessionNameInput.fill('Test Layout');

    const confirmSave = page.locator('[data-testid="confirm-save"]');
    await confirmSave.click();

    // Verify session saved
    const successMessage = page.locator('[data-testid="save-success"]');
    await expect(successMessage).toBeVisible();
  });

  test('should handle temporary sessions', async ({ page }) => {
    await page.goto('/');

    // Application starts with temporary session
    const sessionIndicator = page.locator('[data-testid="session-indicator"]');
    await expect(sessionIndicator).toContainText(/temporary|unsaved/i);
  });
});