import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { ReturnLabelPage } from '../../src/pages/app/returnLabelPage/returnLabelPage';

test.describe('Return Label Generation For External Fulfilled Order', () => {
    let sharedOrderID: string;
    let sharedPage: any;
    let sharedContext: any;
    let shopifyAdminPage: ShopifyAdminPage;
    let orderUploader: ShopifyOrderUploader;
    let returnLabelPage: ReturnLabelPage;

    test.beforeAll(async ({ browser }) => {
        sharedContext = await browser.newContext({ storageState: 'auth.json' });
        sharedPage = await sharedContext.newPage();

        shopifyAdminPage = new ShopifyAdminPage(sharedPage);
        orderUploader = new ShopifyOrderUploader();
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

    test('External Fulfill the order and Generate Return Label', async () => {
        test.setTimeout(120000);
        await shopifyAdminPage.fulfillOrderInShopify(sharedOrderID);
        await returnLabelPage.returnLabelGeneration();  
        console.log('Return label generated successfully for externally fulfilled order');
    });
});

// tests/returnLabels/externalFulfilledOrderReturnLabelGeneration.spec.ts