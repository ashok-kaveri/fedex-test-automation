import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

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
    await pages.shopifyAdmin.navigateToStore(store);
    await pages.shopifyAdmin.searchAndOpenOrder(sharedOrderID, 5);
    await pages.shopifyAdmin.openMoreActions();
    await pages.shopifyAdmin.clickOnGenerateReturnLabel();
    await pages.shippingPage.validateReturnFailureMessageForUnfulfilledOrder();
    console.log('Return Failure message validated successfully for unfulfilled order');
  });
});

// tests/returnLabels/unfulfilledOrderReturnLabelValidation.spec.ts
