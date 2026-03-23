import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Auto Label Generation Flow', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
    const orderID = await orderUploader.uploadOrderWithMultipleProducts([{ productType: 'simple', productIndexes: [1], quantities: [1] }]);

    if (!orderID) throw new Error('Failed to create Shopify order');
    sharedOrderID = orderID;
    console.log(`Order created: ${sharedOrderID}`);
  });

  test('1. Navigate to Shopify order', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToStore(store);
    await pages.shopifyAdmin.searchAndOpenOrder(sharedOrderID, 5);
    await pages.shopifyAdmin.openMoreActions();
    await pages.shopifyAdmin.clickOnAutoLabelGeneration();
    await pages.shippingPage.orderGridColumnValidation(sharedOrderID, 'Label status', 'label generated');
    await expect(pages.shippingPage.ordersTable).toContainText('label generated', { timeout: 8000 });
  });
});
