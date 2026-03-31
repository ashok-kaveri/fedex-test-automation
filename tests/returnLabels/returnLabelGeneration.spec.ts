import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Return Label Generation Flow', { tag: "@regression" }, () => {
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

  test('Navigate to Shopify order and generate label manually', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.generateLabelInApp();
    await pages.orderSummaryPage.verifyLabelGenerated();
    // expect(await productSummaryPage.getSelectedSignatureLabel()).toBe('As Per The General Settings');
    await expect(pages.orderSummaryPage.packagesSection).toBeVisible({ timeout: 10000 });
  });

  test('Generate return label for the order', async ({ pages }) => {
    test.setTimeout(120000);
    // Use the sharedPage from the fixture for direct URL navigation
    await pages.sharedPage.goto(`https://admin.shopify.com/store/${process.env.STORE}/apps/testing-553/shopify`);
    await pages.shippingPage.searchButton.waitFor({ state: 'visible', timeout: 30000 });
    await pages.shippingPage.searchOrderWithRetries(sharedOrderID);
    await pages.shippingPage.orderClick();
    await pages.orderSummaryPage.navigatingToReturnLabelPage();
    await pages.returnLabelPage.validateReturnLabelTitle();
    await expect(pages.returnLabelPage.returnLabelPageTitle).toContainText('Return Label', { timeout: 10000 });
    await pages.sharedPage.reload();
    await pages.returnLabelPage.returnLabelGeneration();
    await pages.sharedPage.waitForLoadState('load');
    await expect(pages.returnLabelPage.successBadge).toBeVisible({ timeout: 40000 });
    await expect(pages.returnLabelPage.downloadLink).toBeVisible({ timeout: 40000 });
    console.log('Return label generated successfully for the order fulfilled from the app');
  });
});

// npx playwright test tests/returnLabels/returnLabelGeneration.spec.ts --project="Google Chrome" --headed
