import { test, expect } from '../../src/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Manual Label Generation Flow', () => {
  let sharedOrderID: string;

  test('Create an order from API', async ({ orderUploader }) => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('Navigate to Shopify order and generate label manually', async ({ 
    page,
    shopifyAdminPage, 
    manualLabelPage, 
    orderSummaryPage 
  }) => {
    test.setTimeout(120000);
    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.generateLabelInApp();
    await orderSummaryPage.verifyLabelGenerated();
  });
});

