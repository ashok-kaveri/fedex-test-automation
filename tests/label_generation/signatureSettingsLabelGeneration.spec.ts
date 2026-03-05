import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { GenerateLabelManuallyPage } from '../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
import { ShippingPage } from '../../src/pages/app/ShippingPage/ShippingPage';
import { SideDockPage } from '../../src/pages/app/ManualLabelPage/SideDockConfig';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation with signature options', () => {
  let sharedOrderID: string;
  let sharedPage: any;
  let sharedContext: any;
  let manualLabelPage: GenerateLabelManuallyPage;
  let shippingPage: ShippingPage;
  let shopifyAdminPage: ShopifyAdminPage;
  let orderSummaryPage: OrderSummaryPage;
  let orderUploader: ShopifyOrderUploader;
  let sideDockConfig: SideDockPage;

  //Signature
  let configuredSignature = 'INDIRECT';

  test.beforeAll(async ({ browser }) => {
    // Create shared context and page for all tests
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();

    manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
    shippingPage = new ShippingPage(sharedPage);
    shopifyAdminPage = new ShopifyAdminPage(sharedPage);
    orderSummaryPage = new OrderSummaryPage(sharedPage);
    orderUploader = new ShopifyOrderUploader();
    sideDockConfig = new SideDockPage(sharedPage);
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

  test('Navigate to Shopify order, add signature config and generate label manually', async () => {
    test.setTimeout(120000);
    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.verifyOrderHeading(sharedOrderID);
    await sideDockConfig.selectFedExSignature(configuredSignature);
    await expect(sideDockConfig.fedexSignatureDropdown).toHaveValue(configuredSignature);
    await manualLabelPage.openRateRequestLog();
    let actualsignature = await manualLabelPage.getSignatureValueFromRequestLog();
    console.log(actualsignature);
    await manualLabelPage.closeRatesLog();
    expect(actualsignature).toBe(configuredSignature);
    await manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await orderSummaryPage.verifyLabelGenerated();
  });
});
