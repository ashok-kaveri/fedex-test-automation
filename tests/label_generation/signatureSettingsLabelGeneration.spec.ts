import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { SideDockPage } from '../../src/pages/app/ManualLabelPage/SideDockConfig';

//test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation with signature options', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  //Signature
  const signatureOptions = ['ADULT', 'DIRECT', 'INDIRECT', 'NO_SIGNATURE_REQUIRED'];

  test.beforeAll(async ({ browser }) => {
    orderUploader = new ShopifyOrderUploader();
  });

  for (const configuredSignature of signatureOptions) {
    test(`Generate label with signature option: ${configuredSignature}`, async ({ pages }) => {
      //Creating Order
      test.setTimeout(100000);
      const orderID = (await orderUploader.uploadOrder()) as string;
      console.log('Order ID:', orderID);

      await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(orderID);
      await pages.sideDockPage.selectFedExSignature(configuredSignature);
      await expect(pages.sideDockPage.fedexSignatureDropdown).toHaveValue(configuredSignature);
      await pages.manualLabelPage.openRateRequestLog();
      const actualSignature = await pages.manualLabelPage.getSignatureValueFromRequestLog();
      console.log(actualSignature);
      expect(actualSignature).toBe(configuredSignature);
      await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
      await pages.orderSummaryPage.verifyLabelGenerated();
    });
  }
});
