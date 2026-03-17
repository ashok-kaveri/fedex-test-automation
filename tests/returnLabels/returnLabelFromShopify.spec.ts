import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { GenerateLabelManuallyPage } from '../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
import { ReturnLabelPage } from '../../src/pages/app/returnLabelPage/returnLabelPage';


const store = process.env.STORE;

if (!store) {
    throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Return Label Generation Flow', () => {
    let sharedOrderID: string;
    let sharedPage: any;
    let sharedContext: any;
    let manualLabelPage: GenerateLabelManuallyPage;
    let shopifyAdminPage: ShopifyAdminPage;
    let orderUploader: ShopifyOrderUploader;
    let orderSummaryPage: OrderSummaryPage;
    let returnLabelPage: ReturnLabelPage;

    test.beforeAll(async ({ browser }) => {
        sharedContext = await browser.newContext({ storageState: 'auth.json' });
        sharedPage = await sharedContext.newPage();

        manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
        shopifyAdminPage = new ShopifyAdminPage(sharedPage);
        orderUploader = new ShopifyOrderUploader();
        orderSummaryPage = new OrderSummaryPage(sharedPage);
        returnLabelPage = new ReturnLabelPage(sharedPage);

    });

    test.afterAll(async () => {
        await sharedPage?.close();
        await sharedContext?.close();
    });


    test('Create an order from API', async () => {
        const orderID = (await orderUploader.uploadOrder()) as string;
        console.log('Order ID:', orderID);
        expect(orderID).toBeTruthy();
        sharedOrderID = orderID;
    });

    test('Navigate to Shopify order and generate label manually', async () => {
        test.setTimeout(60000);
        await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
        await manualLabelPage.generateLabelInApp();
        await orderSummaryPage.verifyLabelGenerated();

    });

    test('Navigate to Shopify order and generate return label for a fulfilled order', async () => {

    await shopifyAdminPage.navigateToOrderInShopifyAndCheckStatus(sharedOrderID);
    // await shopifyAdminPage.clickGenerateReturnLabelLink();
    await orderSummaryPage.navigatingToReturnLabelPage();
    await returnLabelPage.validateReturnLabelTitle();
    await returnLabelPage.returnLabelGeneration(); 
    
});


});

