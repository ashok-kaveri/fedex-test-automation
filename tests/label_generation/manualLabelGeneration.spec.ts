import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { GenerateLabelManuallyPage } from '../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
import { ShippingPage } from '../../src/pages/app/ShippingPage/ShippingPage';


test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow', () => {
  let sharedOrderID: string;
  let sharedPage: any;
  let sharedContext: any;
  let manualLabelPage: GenerateLabelManuallyPage;
  let shippingPage: ShippingPage;
  let shopifyAdminPage: ShopifyAdminPage;
  let orderSummaryPage: OrderSummaryPage;
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async ({ browser }) => {
    // Create shared context and page for all tests
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();

    manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
    shippingPage = new ShippingPage(sharedPage);
    shopifyAdminPage = new ShopifyAdminPage(sharedPage);
    orderSummaryPage = new OrderSummaryPage(sharedPage);
    orderUploader = new ShopifyOrderUploader();
  });

  test.afterAll(async () => {
    await sharedPage?.close();
    await sharedContext?.close();
  });

  test('Create an order from API', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('Navigate to Shopify order and generate label manually', async () => {
    test.setTimeout(60000);
    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.generateLabelInApp();
    await orderSummaryPage.verifyLabelGenerated();
  });
<<<<<<< HEAD

  test('5. Verify order in Orders table', async () => {
    test.setTimeout(60000);
    const shippingPage = new ShippingPage(sharedPage);
    await shippingPage.navigateToOrdersPage();
    await shippingPage.searchOrder(sharedOrderID, 3);
  });
=======
>>>>>>> automation-shinchan
});
