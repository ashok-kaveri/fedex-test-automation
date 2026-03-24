import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;
if (!store) {
  throw new Error('STORE environment variable is required');
}
test.describe.configure({ mode: 'serial' });

test.describe('FedEx One Rate', { tag: "@regression" }, () => {
  let orderUploader: ShopifyOrderUploader;
  let sharedOrderID: string;

  test('Goto Settings and enable FedEx One Rate', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToStore(store);
    await pages.packagingSettingsPage.clickAppButton();
    await pages.packagingSettingsPage.selectAppMenu('settings');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'more settings');
    await expect(pages.packagingSettingsPage.skeletonLoader).toBeHidden();
    await pages.sharedPage.waitForTimeout(2000); // need to be updated (dependency on other test case)
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Packing Method', 'Box Packing');
    await pages.packagingSettingsPage.restoreFedExBoxes();
    await pages.packagingSettingsPage.keepOnlyBoxes({ 'FedEx® Small Box': [1] });
    await pages.packagingSettingsPage.savePackagingDetails();
    await pages.packagingSettingsPage.backButton.click();
    await pages.sharedPage.waitForLoadState('domcontentloaded');
    await expect(pages.additionalServices.fedexOneRateHeading).toBeVisible();
    await pages.additionalServices.enableFedexOneRate(true);
    await pages.additionalServices.clickAnyButtonUsingHeading('FedEx One Rate®', 'Save');
    await expect(pages.additionalServices.successMessage('Fedex One Rate® updated')).toBeVisible();
  });

  test('Create an order from API', async () => {
    orderUploader = new ShopifyOrderUploader();
    const orderID = await orderUploader.uploadOrder();
    // eslint-disable-next-line
    if (!orderID) {
      throw new Error('Failed to create Shopify order');
    }
    sharedOrderID = orderID;
    console.log(`Order created: ${sharedOrderID}`);
    expect(orderID).toBeTruthy();
  });

  test('Navigate to Shopify order and generate label manually', async ({ pages }) => {
    test.setTimeout(180000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.openRateRequestLog();
    const specialServices = await pages.manualLabelPage.getShipmentSpecialServicesFromRequestLog();
    expect(specialServices).toContain('FEDEX_ONE_RATE');
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });
});
