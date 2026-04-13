/**
 * TC: Next / Previous Order Navigation from Order Summary
 *
 * No new order needed — the app's order grid already has existing labeled orders.
 * Flow:
 *   1. Navigate to the PH FedEx app's orders list
 *   2. Click the first order (gives navigation context → Next/Previous buttons appear)
 *   3. TC-001 / TC-002 / TC-007 verify forward/backward navigation
 */
import { test, expect } from '../../src/setup/fixtures';

const store = process.env.STORE;
if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Next / Previous Order Navigation from Order Summary', { tag: '@smoke' }, () => {

  test('Open first order from the app orders grid', async ({ pages }) => {
    test.setTimeout(60000);

    // Navigate directly to the PH FedEx app's orders/shipping list via URL.
    // This avoids new-tab issues caused by clicking the app link in the sidebar.
    await pages.shippingPage.navigateToAppOrdersPage();

    // Click the first order in the list — this sets the navigation context
    // so the Order Summary page shows Next / Previous buttons
    await pages.shippingPage.orderClick();

    // Confirm Next button is visible — this confirms we're in the correct navigation context
    await expect(pages.orderSummaryPage.nextOrderButton).toBeVisible({ timeout: 15000 });
    console.log('✅ Order opened from grid — Next/Previous buttons visible');
  });

  test('TC-001: Next button navigates to the next order in the result set', async ({ pages }) => {
    test.setTimeout(60000);

    // At position 1 — Next must be enabled
    await pages.orderSummaryPage.verifyNextButtonIsEnabled();

    const indicatorBefore = await pages.orderSummaryPage.orderPositionIndicator.textContent();
    console.log(`Position before Next: ${indicatorBefore}`);

    await pages.orderSummaryPage.clickNextOrder();
    await pages.orderSummaryPage.waitForOrderDetailsToLoad();

    console.log(`Verifying position changed after Next`);
    await expect(pages.orderSummaryPage.orderPositionIndicator).not.toHaveText(indicatorBefore ?? '');
  });

  test('TC-002: Previous button navigates to the previous order in the result set', async ({ pages }) => {
    test.setTimeout(60000);

    // At position 2 (after TC-001 clicked Next) — Previous must be enabled
    await pages.orderSummaryPage.verifyPreviousButtonIsEnabled();

    const indicatorBefore = await pages.orderSummaryPage.orderPositionIndicator.textContent();
    console.log(`Position before Previous: ${indicatorBefore}`);

    await pages.orderSummaryPage.clickPreviousOrder();
    await pages.orderSummaryPage.waitForOrderDetailsToLoad();

    console.log(`Verifying position changed after Previous`);
    await expect(pages.orderSummaryPage.orderPositionIndicator).not.toHaveText(indicatorBefore ?? '');
  });

  test('TC-007: Position indicator updates correctly when navigating Next then Previous', async ({ pages }) => {
    test.setTimeout(90000);

    await expect(pages.orderSummaryPage.orderPositionIndicator).toBeVisible();
    await expect(pages.orderSummaryPage.orderPositionIndicator).not.toBeEmpty();
    const initialPosition = await pages.orderSummaryPage.orderPositionIndicator.textContent();
    console.log(`Initial position: ${initialPosition}`);

    // Navigate forward
    await pages.orderSummaryPage.verifyNextButtonIsEnabled();
    await pages.orderSummaryPage.clickNextOrder();
    await pages.orderSummaryPage.waitForOrderDetailsToLoad();

    console.log(`Verifying position changed after Next`);
    await expect(pages.orderSummaryPage.orderPositionIndicator).not.toHaveText(initialPosition ?? '');

    // Navigate back — must return to initial value
    await pages.orderSummaryPage.verifyPreviousButtonIsEnabled();
    await pages.orderSummaryPage.clickPreviousOrder();
    await pages.orderSummaryPage.waitForOrderDetailsToLoad();

    console.log(`Verifying position restored after Previous`);
    await expect(pages.orderSummaryPage.orderPositionIndicator).toHaveText(initialPosition ?? '');
  });
});
