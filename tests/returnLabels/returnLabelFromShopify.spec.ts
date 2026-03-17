import { test, expect } from '../../src/setup/fixtures';
import { Page, BrowserContext } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Return Label Generation Flow', () => {
  let sharedOrderID: string;
  let sharedPage: Page;
  let sharedContext: BrowserContext;
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();
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

  test('Navigate to Shopify order and generate label manually', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.generateLabelInApp();
    await pages.orderSummaryPage.verifyLabelGenerated();
    expect(true).toBeTruthy();
  });

  test('Navigate to Shopify order and generate return label for a fulfilled order', async ({ pages }) => {
    await pages.shopifyAdmin.navigateToOrderInShopifyAndCheckStatus(sharedOrderID);
    // await shopifyAdminPage.clickGenerateReturnLabelLink();
    await pages.orderSummaryPage.navigatingToReturnLabelPage();
    await pages.returnLabelPage.validateReturnLabelTitle();
    await pages.returnLabelPage.returnLabelGeneration();
    expect(true).toBeTruthy();
  });
});

//npx playwright test tests/returnLabels/returnLabelFromShopify.spec.ts --project="Google Chrome" --headed
