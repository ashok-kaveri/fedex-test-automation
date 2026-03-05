import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label + Pickup Flow', () => {
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

  test('Click Back and search the order and pickup', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.manualLabelPage.clickBackButtonInManualLabelGenerationPage();
    await pages.shippingPage.selectOrderCheckboxByOrderIdWithLabelGenerated(sharedOrderID);
    await pages.shippingPage.clickMoreActionsItem('Request Pick Up');
    const requestPickupTriggeredAt = pages.shippingPage.getLastRequestPickupTriggeredAt();
    expect(requestPickupTriggeredAt).not.toBeNull();
    await pages.shippingPage.clickOnYesInPopUp();
    await pages.pickupPage.verifyOrderStatus(sharedOrderID, 'Pickup requested');
    await pages.pickupPage.page.waitForURL(/pickup/i);
    await expect(pages.pickupPage.pickupHeading).toContainText('Pickups');
    await pages.pickupPage.processPickupRow(sharedOrderID, requestPickupTriggeredAt ?? undefined);
    await pages.pickupPage.page.waitForTimeout(1000);
    await pages.pickupPage.clickRowByOrderId(sharedOrderID);
    await pages.pickupPage.verifyPickupField('Status', 'SUCCESS');
    await pages.pickupPage.verifyPickupField('Orders', sharedOrderID);
    const pickupNumber = await pages.pickupPage.processPickupRow(sharedOrderID, requestPickupTriggeredAt ?? undefined);
    await pages.pickupPage.verifyPickupField('Pickup Confirmation Number', pickupNumber);
    await pages.pickupPage.page.waitForTimeout(10000);
  });
});
