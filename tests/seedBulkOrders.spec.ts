/**
 * Bulk Order Seeder
 * =================
 * Creates multiple Shopify orders via the Admin API for use in bulk-buy tests.
 *
 * Usage:
 *   npm run seed:bulk                               # uses defaults from .env
 *   TEMPLATE_ORDER_ID=6888460681264 ORDER_COUNT=10 npm run seed:bulk
 *   ORDER_COUNT=5 npm run seed:bulk                # uses fresh products (no template)
 *
 * Environment variables:
 *   TEMPLATE_ORDER_ID  — Shopify order ID to clone (optional).
 *                        If set: clones that exact order (same products, address).
 *                        If not set: creates fresh orders from productsconfig.json.
 *   ORDER_COUNT        — How many orders to create (default: 5)
 *   ORDER_DELAY_MS     — Delay between orders in ms (default: 1000)
 *   STORE              — Shopify store name (required, set in .env)
 *   SHOPIFY_ACCESS_TOKEN — Admin API token (required, set in .env)
 *   SHOPIFY_API_VERSION  — API version (required, set in .env)
 */

import { test } from '@playwright/test';
import ShopifyOrderUploader from '../src/helpers/createOrder';

const TEMPLATE_ORDER_ID = process.env.TEMPLATE_ORDER_ID || '';
const ORDER_COUNT       = parseInt(process.env.ORDER_COUNT || '5', 10);
const ORDER_DELAY_MS    = parseInt(process.env.ORDER_DELAY_MS || '1000', 10);

test.describe('Bulk Order Seed', () => {
  test(`Create ${ORDER_COUNT} orders${TEMPLATE_ORDER_ID ? ` (clone of #${TEMPLATE_ORDER_ID})` : ''}`, async ({ request }) => {
    test.setTimeout((ORDER_COUNT * (ORDER_DELAY_MS + 10000)) + 30000); // generous timeout

    const uploader = new ShopifyOrderUploader(request);
    let names: string[] = [];
    let ids:   string[] = [];

    if (TEMPLATE_ORDER_ID) {
      // ── Clone from existing order (your shopify-actions workflow, fully automated)
      console.log(`\n📦 Cloning order #${TEMPLATE_ORDER_ID} × ${ORDER_COUNT}…`);
      ({ names, ids } = await uploader.uploadBulkOrdersFromExisting(
        TEMPLATE_ORDER_ID,
        ORDER_COUNT,
        ORDER_DELAY_MS,
      ));
    } else {
      // ── Create fresh orders from productsconfig.json
      console.log(`\n📦 Creating ${ORDER_COUNT} fresh orders…`);
      ({ names, ids } = await uploader.uploadBulkOrders(ORDER_COUNT, {
        delayMs: ORDER_DELAY_MS,
      }));
    }

    console.log('\n✅ Bulk orders created:');
    names.forEach((name, i) => console.log(`   ${i + 1}. ${name}  (id: ${ids[i]})`));
    console.log(`\nTotal: ${names.length}/${ORDER_COUNT} orders created`);

    if (names.length === 0) {
      throw new Error('No orders were created — check STORE / SHOPIFY_ACCESS_TOKEN in .env');
    }
  });
});
