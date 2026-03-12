import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../../src/pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../../../src/pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../../src/pages/app/OrderSummaryPage/OrderSummaryPage';

const BATTERY_MATERIAL = 'LITHIUM_ION';
const BATTERY_PACKING = 'CONTAINED_IN_EQUIPMENT';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Lithium Ion (Contained In Equipment)', () => {
  // ── Shared State ──────────────────────────────────────────────────────────
  let sharedOrderID: string;
  let sharedPage: Page;
  let sharedContext: BrowserContext;
  let capturedDocumentUrl: string = '';

  // ── Page Objects ──────────────────────────────────────────────────────────
  let orderUploader: ShopifyOrderUploader;
  let productPage: ProductPage;
  let productSummaryPage: ProductSummaryPage;
  let shopifyAdminPage: ShopifyAdminPage;
  let shippingPage: ShippingPage;
  let manualLabelPage: GenerateLabelManuallyPage;
  let orderSummaryPage: OrderSummaryPage;

  // ── Hooks ─────────────────────────────────────────────────────────────────

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext({ storageState: 'auth.json' });
    sharedPage = await sharedContext.newPage();

    orderUploader = new ShopifyOrderUploader();
    shopifyAdminPage = new ShopifyAdminPage(sharedPage);
    shippingPage = new ShippingPage(sharedPage);
    productPage = new ProductPage(sharedPage);
    productSummaryPage = new ProductSummaryPage(sharedPage);
    manualLabelPage = new GenerateLabelManuallyPage(sharedPage);
    orderSummaryPage = new OrderSummaryPage(sharedPage);
  });

  test.afterAll(async () => {
    await shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('Simple 1');
    await productSummaryPage.disableSpecialService('battery');
    expect(await productSummaryPage.isBatteryCheckbox.isChecked()).toBe(false);
    console.log('✔ Battery is disabled');
    await sharedPage?.close();
    await sharedContext?.close();
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Lithium Ion (Contained In Equipment) battery on product', async () => {
    test.setTimeout(120_000);

    await shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('Simple 1');
    await productSummaryPage.updateProductBattery(BATTERY_MATERIAL, BATTERY_PACKING);

    await expect(productSummaryPage.batteryMaterialTypeDropdown).toHaveValue(BATTERY_MATERIAL);
    await expect(productSummaryPage.batteryPackingTypeDropdown).toHaveValue(BATTERY_PACKING);
    console.log(`✔ Battery settings updated — Material: ${BATTERY_MATERIAL}, Packing: ${BATTERY_PACKING}`);
  });

  test('Step 2 | Create order via API with battery product', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify Battery XML payload', async () => {
    test.setTimeout(90_000);

    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await manualLabelPage.generatePackages();
    await manualLabelPage.getShippingRates();

    const xmlContent = await manualLabelPage.verifyBatteryInXmlRequest();

    expect(xmlContent).toContain('<ns:SpecialServiceTypes>BATTERY</ns:SpecialServiceTypes>');
    expect(xmlContent).toContain('<ns:BatteryDetails>');
    expect(xmlContent).toContain(`<ns:Material>${BATTERY_MATERIAL}</ns:Material>`);
    expect(xmlContent).toContain(`<ns:Packing>${BATTERY_PACKING}</ns:Packing>`);
    expect(xmlContent).toContain('<ns:RegulatorySubType>IATA_SECTION_II</ns:RegulatorySubType>');
    console.log(`✔ XML confirmed — BATTERY service present with ${BATTERY_MATERIAL} / ${BATTERY_PACKING}`);

    await manualLabelPage.selectFirstShippingService();
    await manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await orderSummaryPage.verifyLabelGenerated();
  });
  
  test('Step 4 | Print label, capture URL and verify PDF text', async () => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await orderSummaryPage.captureDocumentUrl(sharedContext, () => orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ELB');

    console.log(`✔ "ELB" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/Battery/batteryLithiumIonContained.spec.ts --project="Google Chrome" --headed
