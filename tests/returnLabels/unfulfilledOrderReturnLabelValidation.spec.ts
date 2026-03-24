import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.describe('Return Label Generation For External Fulfilled Order', { tag: "@regression" }, () => {
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

    test('External Fulfill the order and Generate Return Label', async ({pages}) => {
        test.setTimeout(120000);
        await pages.shopifyAdmin.navigateToStore(process.env.STORE!);
        await pages.shopifyAdmin.searchAndOpenOrder(sharedOrderID, 5);
        await pages.shopifyAdmin.openMoreActions();
        await pages.shopifyAdmin.clickOnGenerateReturnLabel();
        const returnFailure = await pages.shippingPage.validateReturnFailureMessageForUnfulfilledOrder();
        await expect(returnFailure.title).toBeVisible({ timeout: 10000 });
        await expect(returnFailure.description).toBeVisible({ timeout: 10000 });
    });
});


// npx playwright test tests/returnLabels/unfulfilledOrderReturnLabelValidation.spec.ts --project="Google Chrome" --headed 


