import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
    throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Return Label Generation Flow', () => {
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

    test('Navigate to Shopify order and generate label manually', async ({pages}) => {
        test.setTimeout(60000);
        await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
        await pages.manualLabelPage.generateLabelInApp();
        await pages.orderSummaryPage.verifyLabelGenerated();
        await expect(pages.orderSummaryPage.packagesSection).toBeVisible({ timeout: 10000 });

    });

    test('Navigate to Shopify order and generate return label for a fulfilled order', async ({pages}) => {

    await pages.shopifyAdmin.navigateToOrderInShopifyAndCheckStatus(sharedOrderID);
    // await shopifyAdminPage.clickGenerateReturnLabelLink();
    // await pages.orderSummaryPage.navigatingToReturnLabelPage();
    // await pages.returnLabelPage.validateReturnLabelTitle();
    await pages.returnLabelPage.validateReturnLabelTitle();
    await expect(pages.returnLabelPage.returnLabelPageTitle).toContainText('Return Label', { timeout: 10000 });
    await pages.sharedPage.reload();
    await pages.returnLabelPage.returnLabelGeneration(); 
    await pages.sharedPage.waitForLoadState('load');
    await expect(pages.returnLabelPage.successBadge).toBeVisible({ timeout: 40000 });
    await expect(pages.returnLabelPage.downloadLink).toBeVisible({ timeout: 40000 });
    console.log('✔ Return label generated successfully for externally fulfilled order');
    
});


});

//npx playwright test tests/returnLabels/returnLabelFromShopify.spec.ts --project="Google Chrome" --headed

