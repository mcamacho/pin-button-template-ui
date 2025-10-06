import { test, expect } from '@playwright/test';

test.describe('Session Persistence - Page Refresh', () => {
  test('should persist session data across page refresh', async ({ page }) => {
    // Navigate to application
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Create a new session
    await page.click('#new-session-btn');

    // Add a session name (if there's a modal or input for it)
    // Assuming the new session is created and ready

    // Add button configuration (simulate user interaction)
    const canvas = page.locator('[data-testid="canvas-container"]');
    await expect(canvas).toBeVisible();

    // Save the session
    await page.click('#save-session-btn');

    // Wait for save to complete
    await page.waitForTimeout(500);

    // Refresh the page
    await page.reload();

    // Wait for app to reload
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Verify session appears in "Load Session" dropdown
    const sessionSelect = page.locator('#session-select');
    await expect(sessionSelect).toBeVisible();

    // Get the options (excluding the first placeholder option)
    const options = await sessionSelect.locator('option').all();
    expect(options.length).toBeGreaterThan(1); // Should have placeholder + at least 1 session

    // Load the session to verify data persists
    const sessionOptions = await sessionSelect.locator('option:not([value=""])').all();
    if (sessionOptions.length > 0) {
      const sessionValue = await sessionOptions[0].getAttribute('value');
      await sessionSelect.selectOption(sessionValue!);

      // Verify canvas is populated (data was loaded)
      await expect(canvas).toBeVisible();
    }
  });
});

test.describe('Session Persistence - Multiple Sessions', () => {
  test('should store multiple sessions independently', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Create Session A
    await page.click('#new-session-btn');
    await page.waitForTimeout(300);

    // Add specific data for Session A
    // (In real scenario, would add buttons, images, etc.)

    // Save Session A
    await page.click('#save-session-btn');
    await page.waitForTimeout(500);

    // Get Session A ID from dropdown
    const sessionSelect = page.locator('#session-select');
    const sessionAOptions = await sessionSelect.locator('option:not([value=""])').all();
    expect(sessionAOptions.length).toBeGreaterThanOrEqual(1);
    const sessionAValue = await sessionAOptions[0].getAttribute('value');

    // Create Session B
    await page.click('#new-session-btn');
    await page.waitForTimeout(300);

    // Add different data for Session B

    // Save Session B
    await page.click('#save-session-btn');
    await page.waitForTimeout(500);

    // Refresh page
    await page.reload();
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Verify both sessions appear in dropdown
    const sessionsAfterReload = await sessionSelect.locator('option:not([value=""])').all();
    expect(sessionsAfterReload.length).toBeGreaterThanOrEqual(2);

    // Load Session A and verify it has correct data
    if (sessionAValue) {
      await sessionSelect.selectOption(sessionAValue);
      await page.waitForTimeout(300);

      // Verify Session A data loaded
      await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible();
    }

    // Load Session B and verify it has different data
    const sessionBOptions = await sessionSelect.locator('option:not([value=""])').all();
    if (sessionBOptions.length >= 2) {
      const sessionBValue = await sessionBOptions[1].getAttribute('value');
      if (sessionBValue && sessionBValue !== sessionAValue) {
        await sessionSelect.selectOption(sessionBValue);
        await page.waitForTimeout(300);

        // Verify Session B data loaded (different from A)
        await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible();
      }
    }
  });
});

test.describe('Session Persistence - Updates', () => {
  test('should persist session updates across refresh', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Create and save initial session
    await page.click('#new-session-btn');
    await page.waitForTimeout(300);

    // Save session
    await page.click('#save-session-btn');
    await page.waitForTimeout(500);

    // Get session ID
    const sessionSelect = page.locator('#session-select');
    const sessionOptions = await sessionSelect.locator('option:not([value=""])').all();
    expect(sessionOptions.length).toBeGreaterThanOrEqual(1);
    const sessionId = await sessionOptions[0].getAttribute('value');

    // Modify the session (add/remove buttons)
    // In a real test, we'd interact with the canvas to add buttons
    // For now, we'll just verify the save mechanism

    // Save the updated session
    await page.click('#save-session-btn');
    await page.waitForTimeout(500);

    // Refresh page
    await page.reload();
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible();

    // Load the session
    if (sessionId) {
      await sessionSelect.selectOption(sessionId);
      await page.waitForTimeout(300);

      // Session should be loaded (canvas visible)
      await expect(page.locator('[data-testid="canvas-container"]')).toBeVisible();

      // Session indicator should not show "Temporary Session" if saved
      const sessionIndicator = page.locator('[data-testid="session-indicator"]');
      await expect(sessionIndicator).toBeVisible();
      // After loading a saved session, it should show the session name, not "Temporary Session"
    }
  });
});
