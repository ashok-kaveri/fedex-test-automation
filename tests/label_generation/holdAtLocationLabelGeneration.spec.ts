import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow for Hold At Location', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;
  const HAL_LOCATION = 'EMTKI';

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
    await pages.manualLabelPage.openRateRequestLog();
    const halDetails = await pages.manualLabelPage.getHALDetailsFromRequestLog();
    expect(halDetails.specialServices).toContain('HOLD_AT_LOCATION');
    expect(halDetails.locationId).toBe(HAL_LOCATION);
  });
});
