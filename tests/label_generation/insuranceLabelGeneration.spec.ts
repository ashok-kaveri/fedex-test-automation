import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation with Insurance', { tag: "@regression" }, () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  test.beforeEach(async () => {
    orderUploader = new ShopifyOrderUploader();
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('Verify Insurance with percentage of Product price', async ({ pages }) => {
    test.setTimeout(100000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    const basePrice = await pages.manualLabelPage.getProductPriceValue();
    const percentage = 50;
    const expectedProdPrice = (basePrice * percentage) / 100;
    await pages.sideDockPage.addInsuranceDetails({
      liabilityType: 'New',
      insuranceType: 'Percentage of Product Price',
      percentage: percentage,
    });
    await pages.manualLabelPage.openRateRequestLog();
    const actualProdPrice = await pages.manualLabelPage.getInsuranceValueFromRequestLog();
    expect(actualProdPrice).toEqual(expectedProdPrice);
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Verify Insurance with declared value and used or reconditioned as liability type', async ({ pages }) => {
    test.setTimeout(100000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    const basePrice = await pages.manualLabelPage.getProductPriceValue();
    await pages.sideDockPage.addInsuranceDetails({
      liabilityType: 'Used or Reconditioned',
      insuranceType: 'Declared Value of Product',
    });
    await pages.manualLabelPage.openRateRequestLog();
    const actualProdPrice = await pages.manualLabelPage.getInsuranceValueFromRequestLog();
    expect(actualProdPrice).toEqual(basePrice);
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Verify Insurance is NOT sent when disabled', async ({ pages }) => {
    test.setTimeout(100000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.sideDockPage.disableThirdPartyInsurance();
    await pages.manualLabelPage.openRateRequestLog();
    const decValue = await pages.manualLabelPage.getInsuranceValueFromRequestLog();
    expect(decValue).toBe(null);
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });
});
