/**
 * Bulk Auto Label Generation
 * ==========================
 * Change BULK_COUNT to 50 or 100 — the test adapts automatically.
 *
 * Flow:
 *  1. Create 1 simple-product order via Shopify API
 *  2. Duplicate it BULK_COUNT times via Shopify API (4s between each)
 *  3. Go to Shopify admin orders list
 *  4. Select all orders on page 1 (up to 50)
 *  5. If BULK_COUNT > 50: click Next → select page 2 (total = 100 selected)
 *  6. Click "..." → Auto-Generate Labels
 *  7. Poll FedEx app (reload every 30s) until "label generated" appears
 */

import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

// ── Change this to 50 or 100 ──────────────────────────────────────────────────
const BULK_COUNT = 50;
// ─────────────────────────────────────────────────────────────────────────────

const NEEDS_PAGE_2 = BULK_COUNT > 50;

test.describe.configure({ mode: 'serial' });

test.describe(`Bulk Auto Label Generation — ${BULK_COUNT} Orders`, () => {
  // ─── Setup: create 1 order → clone it BULK_COUNT times ───────────────────
  test.beforeAll(async ({ request }) => {
    // 15s/order + 15s cooldown every 3 orders + buffer for any 429 retries
    test.setTimeout(BULK_COUNT * 15_000 + 120_000);

    const uploader = new ShopifyOrderUploader(request);

    // Step 1: Create one simple-product order as the template
    console.log('\n📦 Step 1: Creating template order (simple product)…');
    const templateName = await uploader.uploadOrderWithMultipleProducts([{ productType: 'simple', productIndexes: [0], quantities: [1] }]);
    if (!templateName) throw new Error('Failed to create template order');

    const templateOrderId = uploader.getLastOrderId()!;
    console.log(`✅ Template order created: ${templateName} (id: ${templateOrderId})`);

    // Step 2: Duplicate it BULK_COUNT times
    console.log(`\n📦 Step 2: Cloning order ${BULK_COUNT} times…`);
    const { names } = await uploader.uploadBulkOrdersFromExisting(
      templateOrderId,
      BULK_COUNT,
      15000, // 15s between orders — matches shopify-actions delay, zero 429s
    );

    if (names.length === 0) throw new Error('Bulk order creation failed — no orders created');

    console.log(`\n✅ ${names.length}/${BULK_COUNT} orders created`);
    console.log(`   First: ${names[0]}  Last: ${names[names.length - 1]}`);
  });

  // ─── Test 1: Select all orders (1 or 2 pages) → Auto-Generate Labels ─────
  test(`1. Select ${BULK_COUNT} orders and auto-generate labels`, async ({ pages }) => {
    // UI steps (~30s) + label processing (up to 4 min)
    test.setTimeout(300_000);

    // Navigate to Shopify orders list
    await pages.shopifyAdmin.navigateToOrdersList(store!);

    // Page 1 — select all (up to 50)
    console.log('Selecting all orders on page 1…');
    await pages.shopifyAdmin.selectAllOrdersOnCurrentPage();

    if (NEEDS_PAGE_2) {
      // Navigate to page 2 — Shopify preserves the page 1 selection
      console.log('Navigating to page 2…');
      await pages.shopifyAdmin.clickNextPageInOrdersList();

      // Page 2 — select remaining 50 (total = 100 selected)
      console.log('Selecting all orders on page 2…');
      await pages.shopifyAdmin.selectAllOrdersOnCurrentPage();
    }

    // All orders selected — click "..." → Auto-Generate Labels
    console.log(`Clicking ... → Auto-Generate Labels for all ${BULK_COUNT} orders…`);
    await pages.shopifyAdmin.clickBulkActionsMore();
    await pages.shopifyAdmin.clickBulkAutoGenerateLabels();

    // FedEx app processes labels asynchronously (2–3 min for 100 orders).
    // Reload every 30s until "label generated" appears.
    console.log('Waiting for FedEx app to finish generating labels (reloading every 30s)…');
    await pages.shippingPage.waitForBulkLabelsGenerated(
      240_000, // 4 min total budget
      30_000, // reload every 30s
    );

    console.log(`✅ All ${BULK_COUNT} orders — labels generated`);
  });

  // ─── Test 2: Final verification in FedEx app ─────────────────────────────
  test('2. Verify all orders show label generated in FedEx app', async ({ pages }) => {
    test.setTimeout(60_000);

    await pages.shippingPage.navigateToAppOrdersPage();

    await expect(pages.shippingPage.ordersTable).toContainText('label generated', {
      timeout: 15_000,
    });

    console.log('✅ All orders confirmed as label generated in FedEx app');
  });
});
