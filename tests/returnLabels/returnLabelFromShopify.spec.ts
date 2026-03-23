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

    test.beforeAll(async ( ) => {
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
    test.setTimeout(0);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndCheckStatus(sharedOrderID);
    await pages.returnLabelPage.returnLabelGeneration();
    await pages.sharedPage.waitForLoadState('load');
    await expect(pages.returnLabelPage.successBadge).toBeVisible({ timeout: 40000 });
    await expect(pages.returnLabelPage.downloadLink).toBeVisible({ timeout: 40000 });
    console.log('Return label generated successfully for the order fulfilled from the app'); 
    
});


});

//npx playwright test tests/returnLabels/returnLabelFromShopify.spec.ts --project="Google Chrome" --headed

