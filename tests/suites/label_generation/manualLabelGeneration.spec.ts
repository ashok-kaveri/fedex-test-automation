import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../helpers/createOrder';
import { ShopifyAdminPage } from '../../pages/ShopifyAdminPage';
import { ManualLabelPage } from '../../pages/ManualLabelPage';
import { OrderSummaryPage } from '../../pages/OrderSummaryPage';
import { ShippingPage } from '../../pages/ShippingPage';
import { PickupPage } from '../../pages/PickupPage';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow', () => {
  let sharedOrderID: string;
  let sharedPage: any;
  let sharedContext: any;

  test.beforeAll(async ({ browser }) => {
    // Create shared context and page for all tests
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();
    
    // Create order once for all tests
    const uploader = new ShopifyOrderUploader();
    const orderID = await uploader.uploadOrder();
    if (!orderID) throw new Error('Failed to create Shopify order');
    sharedOrderID = orderID;
    console.log(`Order created: ${sharedOrderID}`);
  });

  test.afterAll(async () => {
    await sharedPage?.close();
    await sharedContext?.close();
  });

  test('1. Navigate to Shopify order', async () => {
    test.setTimeout(60000);

    const shopifyAdmin = new ShopifyAdminPage(sharedPage);

    await shopifyAdmin.navigateToStore(store);
    await shopifyAdmin.searchAndOpenOrder(sharedOrderID, 3);
  });

  test('2. Generate packages manually', async () => {
    test.setTimeout(60000);

    const shopifyAdmin = new ShopifyAdminPage(sharedPage);
    await shopifyAdmin.openMoreActions();
    await shopifyAdmin.openManualLabelPage();
    
    const manualLabelPage = new ManualLabelPage(sharedPage);
    await manualLabelPage.verifyOrderHeading(sharedOrderID);
    await manualLabelPage.generatePackages();
  });

  test('3. Get shipping rates and select first service', async () => {
    test.setTimeout(60000);

    const manualLabelPage = new ManualLabelPage(sharedPage);

    await manualLabelPage.getShippingRates(3);
    await manualLabelPage.selectFirstShippingService();
  });

  test('4. Generate manual label and verify success', async () => {
    test.setTimeout(60000);

    const manualLabelPage = new ManualLabelPage(sharedPage);
    await manualLabelPage.generateLabel();

    const orderSummaryPage = new OrderSummaryPage(sharedPage);
    await orderSummaryPage.verifyLabelGenerated();
  });

  test('5. Verify order in Orders table', async () => {
    test.setTimeout(60000);

    const shippingPage = new ShippingPage(sharedPage);
    await shippingPage.navigate();
    await shippingPage.searchOrder(sharedOrderID, 3);
  });

//   test('6. Request pickup', async () => {
//     test.setTimeout(60000);

//     const shippingPage = new ShippingPage(sharedPage);
//     await shippingPage.selectAllOrders();
//     await shippingPage.openMoreActions();

//     const pickupPage = new PickupPage(sharedPage);
//     await pickupPage.requestPickup();
//     await pickupPage.verifyPickupPage();
//   });

//   test('7. Verify pickup details and status', async () => {
//     test.setTimeout(60000);

//     const pickupPage = new PickupPage(sharedPage);
    
//     await pickupPage.openPickupDetails(sharedOrderID);
//     await pickupPage.verifyPickupDetails(sharedOrderID);
//     await pickupPage.verifyPickupStatus('FAILURE');
//   });
});

