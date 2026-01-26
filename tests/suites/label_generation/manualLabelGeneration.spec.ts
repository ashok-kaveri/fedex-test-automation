import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../helpers/createOrder';
import { ShopifyAdminPage } from '../../pages/ShopifyAdminPage';
import { FedExAppPage } from '../../pages/FedExAppPage';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow - End to End', () => {
  let sharedOrderID: string;
  let sharedPage: any;

  test.beforeAll(async ({ browser }) => {
    // Create a persistent context and page for all tests
    const context = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await context.newPage();
    
    // Create order once for all tests
    const uploader = new ShopifyOrderUploader();
    const orderID = await uploader.uploadOrder();
    if (!orderID) throw new Error('Failed to create Shopify order');
    sharedOrderID = orderID;
    console.log(`Order created: ${sharedOrderID}`);
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
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
    
    const fedexApp = new FedExAppPage(sharedPage);
    await fedexApp.verifyOrderHeadingInOrderSummary(sharedOrderID);
    await fedexApp.generatePackagesInManualPage();
  });

  test('3. Get shipping rates and select first service', async () => {
    test.setTimeout(60000);

    const fedexApp = new FedExAppPage(sharedPage);

    await fedexApp.getShippingRatesInManualPage(3);
    await fedexApp.selectFirstShippingServiceInManualPage();
  });

  test('4. Generate manual label and verify success', async () => {
    test.setTimeout(60000);

    const fedexApp = new FedExAppPage(sharedPage);

    await fedexApp.generateManualLabel();
    await fedexApp.verifyLabelGeneratedInOrderSummary();
  });

  test('5. Verify order in Orders table', async () => {
    test.setTimeout(60000);

    const fedexApp = new FedExAppPage(sharedPage);
    await fedexApp.navigateToOrdersPageInApp();
    await fedexApp.searchOrderInApp(sharedOrderID, 3);
  });

//   test('6. Request pickup', async () => {
//     test.setTimeout(60000);

//     // Continue from test 5 - already in Orders with order found
//     const fedexApp = new FedExAppPage(sharedPage);

//     await fedexApp.selectAllOrdersInApp();
//     await fedexApp.requestPickupInApp();
//     await fedexApp.verifyPickupPageInApp();
    
//     console.log('Then the pickup should be requested successfully');
//   });

//   test('7. Verify pickup details and status', async () => {
//     test.setTimeout(60000);

//     // Continue from test 6 - already on Pickups page
//     const fedexApp = new FedExAppPage(sharedPage);
    
//     await fedexApp.openPickupDetailsInPickupPage(sharedOrderID);
//     await fedexApp.verifyPickupDetailsInPickupPage(sharedOrderID);
//     await fedexApp.verifyPickupStatusInPickupPage('FAILURE');
    
//     console.log('Then the pickup details and status should be verified');
//   });
});

