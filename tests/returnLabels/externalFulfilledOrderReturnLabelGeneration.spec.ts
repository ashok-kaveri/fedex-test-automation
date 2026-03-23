import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Return Label Generation For External Fulfilled Order', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

  test('Create an order from API', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('External Fulfill the order and Generate Return Label', async ({ pages }) => {
    test.setTimeout(120000);

    const fulfillmentStatus = await pages.shopifyAdmin.fulfillOrderInShopify(sharedOrderID);
    expect(fulfillmentStatus).toContain('Fulfilled');
    console.log('✔ Order fulfilled with status:', fulfillmentStatus);

    await pages.returnLabelPage.returnLabelGeneration();
    await pages.sharedPage.waitForLoadState('load');
    await expect(pages.returnLabelPage.successBadge).toBeVisible({ timeout: 40000 });
    await expect(pages.returnLabelPage.downloadLink).toBeVisible({ timeout: 40000 });
    console.log('✔ Return label generated successfully for externally fulfilled order');
  });
});

// npx playwright test tests/returnLabels/externalFulfilledOrderReturnLabelGeneration.spec.ts --project="Google Chrome" --headed
