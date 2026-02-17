import { test, expect } from "@playwright/test";
import ShopifyOrderUploader from "../src/helpers/createOrder";
import { ShopifyAdminPage } from "../src/pages/shopify/ShopifyAdminPage";
import { GenerateLabelManuallyPage } from "../src/pages/app/ManualLabelPage/ManualLabelPage";
import { OrderSummaryPage } from "../src/pages/app/OrderSummaryPage/OrderSummaryPage";
import { ShippingPage } from "../src/pages/app/ShippingPage/ShippingPage";
import { PickupPage } from "../src/pages/app/PickupPage/PickupPage.ts";

test.describe.configure({ mode: "serial" });

test.describe("Manual Label Generation Flow", () => {
  let sharedOrderID: string;
  let sharedPage: any;
  let sharedContext: any;
  let manualLabelPage: GenerateLabelManuallyPage;
  let shippingPage: ShippingPage;
  let shopifyAdminPage: ShopifyAdminPage;
  let orderSummaryPage: OrderSummaryPage;
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async ({ browser }) => {
    // Create shared context and page for all tests
    sharedContext = await browser.newContext({ storageState: "auth.json" });
    sharedPage = await sharedContext.newPage();

    manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
    shippingPage = new ShippingPage(sharedPage);
    shopifyAdminPage = new ShopifyAdminPage(sharedPage);
    orderSummaryPage = new OrderSummaryPage(sharedPage);
    orderUploader = new ShopifyOrderUploader();
  });

  test.afterAll(async () => {
    await sharedPage?.close();
    await sharedContext?.close();
  });

  test("Create an order from API", async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log("Order ID:", orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test("Navigate to Shopify order and generate label manually", async () => {
    test.setTimeout(180000);
    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(
      sharedOrderID,
    );
    // await sharedPage.pause();

    // Wait for the FedEx app to load after clicking Generate Label in Shopify
    await sharedPage.waitForTimeout(3000);

    await manualLabelPage.generateLabelInApp();
    await sharedPage.waitForTimeout(6000);
    // await orderSummaryPage.verifyLabelGenerated();
  });

  test("Click Back and serach the order and pickup", async () => {
    test.setTimeout(60000);

    await manualLabelPage.clickBackButtonInManualLabelGenerationPage();
    await sharedPage.waitForTimeout(5000);

    // await sharedPage.waitForLoadState();

    await shippingPage.searchOrder(sharedOrderID);
    await shippingPage.clickOnSelectAllOrders();
    await sharedPage.waitForTimeout(3000);
    await shippingPage.openMoreActionsInOrderGrid();
    await sharedPage.waitForTimeout(2000);
    await shippingPage.clickOnRequestPickupButton();
    await sharedPage.waitForTimeout(4000);
    await shippingPage.clickOnYesInPopUp();
    await sharedPage.waitForTimeout(4000);
    
  });
});
