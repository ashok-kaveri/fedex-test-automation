import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../../src/pages/app/ShippingPage/ShippingPage';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Auto Label Generation Flow', () => {
  let sharedOrderID: string;
  let sharedPage: any;
  let sharedContext: any;
  let shopifyAdmin: any;
  let shippingPage: any;


  test.beforeAll(async ({ browser }) => {
    // Create shared context and page for all tests
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();

    shopifyAdmin = new ShopifyAdminPage(sharedPage);
    shippingPage = new ShippingPage(sharedPage);
    
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
    await shopifyAdmin.navigateToStore(store);
    await shopifyAdmin.searchAndOpenOrder(sharedOrderID, 3);
  });

  test('2. Auto Label Generation', async () => {
    test.setTimeout(60000);
    await shopifyAdmin.openMoreActions();
    await shopifyAdmin.clickOnAutoLabelGeneration();
    
    
 
  });

  test('3. Verify order in Orders table', async () => {
    test.setTimeout(60000);
    await shippingPage.searchOrder(sharedOrderID, 3);
  });
});

