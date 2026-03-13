import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

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
    await pages.shopifyAdmin.fulfillOrderInShopify(sharedOrderID);
    await pages.returnLabelPage.returnLabelGeneration();
    console.log('Return label generated successfully for externally fulfilled order');
  });
});

// tests/returnLabels/externalFulfilledOrderReturnLabelGeneration.spec.ts
