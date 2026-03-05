import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { GenerateLabelManuallyPage } from '../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
import { ShippingPage } from '../../src/pages/app/ShippingPage/ShippingPage';
import { PickupPage } from '../../src/pages/app/PickupPage/PickupPage';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow', { tag: '@sanity' }, () => {
  let sharedOrderID: string;
  let sharedPage: any;
  let sharedContext: any;
  let manualLabelPage: GenerateLabelManuallyPage;
  let shippingPage: ShippingPage;
  let shopifyAdminPage: ShopifyAdminPage;
  let orderSummaryPage: OrderSummaryPage;
  let orderUploader: ShopifyOrderUploader;
  let pickupPage: PickupPage;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();

    manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
    shippingPage = new ShippingPage(sharedPage);
    shopifyAdminPage = new ShopifyAdminPage(sharedPage);
    orderSummaryPage = new OrderSummaryPage(sharedPage);
    pickupPage = new PickupPage(sharedPage);
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
    test.setTimeout(180000);
    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.generateLabelInApp();
    await orderSummaryPage.verifyLabelGenerated();
  });

  test('Click Back in OrderSummary and search the order and click request pickup', async () => {
    test.setTimeout(60000);
    await manualLabelPage.clickBackButtonInManualLabelGenerationPage();
    await shippingPage.selectOrderCheckboxByOrderIdWithLabelGenerated(sharedOrderID);
    await shippingPage.clickMoreActionsItem('Request Pick Up');
    await shippingPage.clickOnYesInPopUp();
    const requestPickupTriggeredAt = shippingPage.getLastRequestPickupTriggeredAt();
    expect(requestPickupTriggeredAt).not.toBeNull();
    await sharedPage.waitForURL(/pickup/i);
    await expect(pickupPage.pickupHeading).toContainText('Pickups');
    const pickupNumber = await pickupPage.verifyPickupRowColumns(sharedOrderID, requestPickupTriggeredAt ?? undefined);
    await pickupPage.clickRowByOrderId(sharedOrderID);
    await pickupPage.verifyPickupDetails('Pickup Confirmation Number', pickupNumber);
    await pickupPage.verifyPickupDetails('Status', 'SUCCESS');
    await pickupPage.verifyPickupDetails('Orders', sharedOrderID);
  });
});
