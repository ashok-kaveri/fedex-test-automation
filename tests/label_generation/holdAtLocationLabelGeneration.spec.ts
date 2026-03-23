import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow for Hold At Location', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;
  const HAL_LOCATION = 'EMTKI';
  let selectedHALType: string | null;

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('Verify HAL in rate logs', async ({ pages }) => {
    test.setTimeout(120000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.sideDockPage.selectHAL(HAL_LOCATION);
    selectedHALType = await pages.sideDockPage.getHALSelectedType();
    await pages.manualLabelPage.openRateRequestLog();
    const halDetails = await pages.manualLabelPage.getHALDetailsFromRequestLog();
    expect(halDetails.specialServices).toContain('HOLD_AT_LOCATION');
    expect(halDetails.locationId).toBe(HAL_LOCATION);
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Verify HAL in Label Logs', async ({ pages }) => {
    await pages.manualLabelPage.clickMoreActionsButton();
    await pages.manualLabelPage.clickHowToSubActions();
    await pages.manualLabelPage.howToHeading.waitFor({ state: 'visible', timeout: 5000 });
    const logPath = await pages.manualLabelPage.downloadLabelLogs();
    await pages.manualLabelPage.dialogModalCloseButton.click();
    const { specialServices, locationId, locationType } = await pages.manualLabelPage.getHALDetailsFromLabelRequestLog(logPath);
    expect(specialServices).toContain('HOLD_AT_LOCATION');
    expect(locationId).toBe(HAL_LOCATION);
    expect(locationType).toBe(selectedHALType);

    console.log(`Verified HAL Location ID: ${locationId}`);
    await pages.manualLabelPage.cleanupLogs(logPath);
  });
});
