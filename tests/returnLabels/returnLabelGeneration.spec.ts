import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
<<<<<<< HEAD
import { ShopifyAdminPage } from '../../src/pages/shopify/ShopifyAdminPage';
import { GenerateLabelManuallyPage } from '../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
import { ShippingPage } from '../../src/pages/app/ShippingPage/ShippingPage';
import { ReturnLabelPage } from '../../src/pages/app/returnLabelPage/returnLabelPage';

=======
>>>>>>> main

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Return Label Generation Flow', () => {
<<<<<<< HEAD
    let sharedOrderID: string;
    let sharedPage: any;
    let sharedContext: any;
    let manualLabelPage: GenerateLabelManuallyPage;
    let shippingPage: ShippingPage;
    let orderSummaryPage: OrderSummaryPage;
    let shopifyAdminPage: ShopifyAdminPage;
    let orderUploader: ShopifyOrderUploader;
    let returnLabelPage: ReturnLabelPage;
=======
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;
>>>>>>> main

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

<<<<<<< HEAD
        manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
        shippingPage = new ShippingPage(sharedPage);
        orderSummaryPage = new OrderSummaryPage(sharedPage);
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

    test('Navigate to Shopify order and generate label manually', async () => {
        test.setTimeout(60000);
        await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
        await manualLabelPage.generateLabelInApp();
        await orderSummaryPage.verifyLabelGenerated();
    });

    test('Generate return label for the order', async () => {
        test.setTimeout(120000);
        await sharedPage.goto(`https://admin.shopify.com/store/${process.env.STORE}/apps/testing-553/shopify`);
        await shippingPage.searchButton.waitFor({ state: 'visible', timeout: 30000 });
        await shippingPage.searchOrder(sharedOrderID);
        await shippingPage.orderClick();
        await orderSummaryPage.navigatingToReturnLabelPage();
        await returnLabelPage.validateReturnLabelTitle();
        await returnLabelPage.returnLabelGeneration();
        console.log('Return label generated successfully for the order fulfilled from the app');
    });

=======
  test('Create an order from API', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('Navigate to Shopify order and generate label manually', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.generateLabelInApp();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });
>>>>>>> main
});


// tests/returnLabels/returnLabelGeneration.spec.ts
