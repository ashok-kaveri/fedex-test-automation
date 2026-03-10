import { test, expect } from '@playwright/test';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { ReturnLabelPage } from '../../src/pages/app/returnLabelPage/returnLabelPage';
import { ShippingPage } from '../../src/pages/app/ShippingPage/ShippingPage';

test.describe('Return Label Generation For External Fulfilled Order', () => {
    let sharedOrderID: string;
    let sharedPage: any;
    let sharedContext: any;
    let shopifyAdminPage: ShopifyAdminPage;
    let orderUploader: ShopifyOrderUploader;
    let returnLabelPage: ReturnLabelPage;
    let shippingPage: ShippingPage;

    test.beforeAll(async ({ browser }) => {
        sharedContext = await browser.newContext({ storageState: 'auth.json' });
        sharedPage = await sharedContext.newPage();

        shopifyAdminPage = new ShopifyAdminPage(sharedPage);
        orderUploader = new ShopifyOrderUploader();
        returnLabelPage = new ReturnLabelPage(sharedPage);
        shippingPage = new ShippingPage(sharedPage);
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
        await shopifyAdminPage.navigateToStore(process.env.STORE!);
        await shopifyAdminPage.searchAndOpenOrder(sharedOrderID, 5);
        await shopifyAdminPage.openMoreActions();
        await shopifyAdminPage.clickOnGenerateReturnLabel();
        await shippingPage.validateReturnFailureMessageForUnfulfilledOrder();  
        console.log('Return Failure message validated successfully for unfulfilled order');
    });
});


// tests/returnLabels/unfulfilledOrderReturnLabelValidation.spec.ts


