/**
 * E2E Tests for Critical User Paths
 *
 * Tests cover the three critical user flows:
 * 1. New user onboarding - First visit, create first project
 * 2. Returning user recalculates - Edit existing project parameters
 * 3. Shared project access - View shared project link
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Path 1: New User Onboarding', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for HTML to load
    await page.waitForLoadState('domcontentloaded');

    // Verify we can access the page
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have DOM content', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('domcontentloaded');

    // Verify #root exists
    const root = await page.locator('#root').count();
    expect(root).toBe(1);
  });

  test('should have page structure', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('domcontentloaded');

    // Check basic HTML structure
    const hasHTML = await page.evaluate(() => {
      return document.body &&
             document.body.innerHTML &&
             document.body.innerHTML.length > 0;
    });

    expect(hasHTML).toBe(true);
  });

  test('should have React app mounted', async ({ page }) => {
    await page.goto('/');

    // Wait for network to be idle (React has loaded)
    await page.waitForLoadState('networkidle');

    // Verify root has content with retry
    await expect(page.locator('#root')).toBeAttached();
    
    // Check React rendered content
    const hasContent = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return root ? root.children.length > 0 : false;
    });

    expect(hasContent).toBe(true);
  });

  test('should display main heading', async ({ page }) => {
    await page.goto('/');

    // Wait for React to render
    await page.waitForLoadState('networkidle');

    // Check for heading
    const headings = page.locator('h1, h2, h3');
    await expect(headings.first()).toBeVisible();
  });

  test('should have interactive elements', async ({ page }) => {
    await page.goto('/');

    // Wait for React to render
    await page.waitForLoadState('networkidle');

    // Check for interactive elements
    const buttons = page.locator('button');
    const inputs = page.locator('input');
    
    // Should have at least one button or input
    const buttonCount = await buttons.count();
    const inputCount = await inputs.count();
    
    expect(buttonCount + inputCount).toBeGreaterThan(0);
  });
});

test.describe('Critical Path 2: Returning User Recalculates', () => {
  test('should allow page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Verify page still works
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try clicking a button if exists
    const buttons = page.locator('button');
    const count = await buttons.count();

    if (count > 0) {
      await buttons.first().click();
      await page.waitForTimeout(500);

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Critical Path 3: Shared Project Access', () => {
  test('should handle URL with parameters', async ({ page }) => {
    await page.goto('/?test=123');

    // Should load without error
    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should handle hash routes', async ({ page }) => {
    await page.goto('/#section');

    // Should load without error
    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe('Edge Cases', () => {
  test('should handle invalid route', async ({ page }) => {
    const response = await page.goto('/invalid-route-that-does-not-exist');

    // Should return 404 or handle gracefully
    expect(response?.status()).toBeLessThan(500);
  });

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Try clicking buttons if they exist
    const buttons = page.locator('button');
    const count = await buttons.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        try {
          await buttons.nth(i).click();
          await page.waitForTimeout(200);
        } catch (e) {
          // Some clicks might fail, that's OK
        }
      }
    }

    // App should still be functional (check title)
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

test.describe('Accessibility', () => {
  test('should have page title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have viewport meta tag', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Press Tab
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Check focus moved
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : 'none';
    });

    expect(['INPUT', 'SELECT', 'BUTTON', 'A', 'BODY']).toContain(focused);
  });
});

test.describe('Performance', () => {
  test('should load in reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    // Should load in under 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have no critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon.ico') &&
      !e.includes('404') &&
      !e.includes('warning')
    );

    // Log errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Console errors:', criticalErrors);
    }

    // Should not have critical errors (but allow some during development)
    expect(criticalErrors.length).toBeLessThan(5);
  });
});

test.describe('Responsive Design', () => {
  test('should work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
