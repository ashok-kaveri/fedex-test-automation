import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow', { tag: '@sanity' }, () => {
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
    test.setTimeout(180000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.generateLabelInApp();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Click Back in OrderSummary and search the order and click request pickup', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.manualLabelPage.clickBackButtonInManualLabelGenerationPage();
    await pages.shippingPage.selectOrderCheckboxByOrderIdWithLabelGenerated(sharedOrderID);
    await pages.shippingPage.clickMoreActionsItem('Request Pick Up');
    await pages.shippingPage.clickOnYesInPopUp();
    const requestPickupTriggeredAt = pages.shippingPage.getLastRequestPickupTriggeredAt();
    expect(requestPickupTriggeredAt).not.toBeNull();
    await pages.sharedPage.waitForURL(/pickup/i);
    await expect(pages.pickupPage.pickupHeading).toContainText('Pickups');
    const pickupNumber = await pages.pickupPage.verifyPickupRowColumns(sharedOrderID, requestPickupTriggeredAt ?? undefined);
    await pages.pickupPage.clickRowByOrderId(sharedOrderID);
    await pages.pickupPage.verifyPickupDetails('Pickup Confirmation Number', pickupNumber);
    await pages.pickupPage.verifyPickupDetails('Status', 'SUCCESS');
    await pages.pickupPage.verifyPickupDetails('Orders', sharedOrderID);
  });
});
