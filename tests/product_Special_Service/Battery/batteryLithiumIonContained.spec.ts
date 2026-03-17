import { Page, BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { test, expect } from '../../../src/setup/fixtures';

const BATTERY_MATERIAL = 'LITHIUM_ION';
const BATTERY_PACKING = 'CONTAINED_IN_EQUIPMENT';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Lithium Ion (Contained In Equipment)', () => {
  // ── Shared State ──────────────────────────────────────────────────────────
  let sharedOrderID: string;
  let sharedPage: Page;
  let sharedContext: BrowserContext;

  // ── Page Objects ──────────────────────────────────────────────────────────
  let orderUploader: ShopifyOrderUploader;
  let productPage: ProductPage;
  let productSummaryPage: ProductSummaryPage;

  // ── Hooks ─────────────────────────────────────────────────────────────────

  test.beforeAll(async ({ pages }) => {
    orderUploader = new ShopifyOrderUploader();
    productPage = new ProductPage(pages.sharedPage);
    productSummaryPage = new ProductSummaryPage(pages.sharedPage);
    sharedContext = pages.sharedPage.context();
    sharedPage = pages.sharedPage;
  });

  test.afterAll(async ({pages}) => {
    await pages.shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('BLAZER');
    await productSummaryPage.disableSpecialService('battery');
    expect(await productSummaryPage.isBatteryCheckbox.isChecked()).toBe(false);
    console.log('✔ Battery is disabled');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Lithium Ion (Contained In Equipment) battery on product', async ({pages}) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('BLAZER');
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

  test('Step 3 | Manually generate label and verify Battery XML payload', async ({pages}) => {
    test.setTimeout(90_000);

    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await pages.manualLabelPage.generatePackages();
    await pages.manualLabelPage.getShippingRates();
    const xmlContent = await pages.manualLabelPage.verifyBatteryInXmlRequest();
    expect(xmlContent).toContain('BATTERY');
    expect(xmlContent).toContain('batteryDetails');
    expect(xmlContent).toContain(`${BATTERY_MATERIAL}`);
    expect(xmlContent).toContain(`${BATTERY_PACKING}`);
    expect(xmlContent).toContain('IATA_SECTION_II');
    console.log(`✔ XML confirmed — BATTERY service present with ${BATTERY_MATERIAL} / ${BATTERY_PACKING}`);


    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });
  
  test('Step 4 | Print label, capture URL and verify PDF text', async ({pages}) => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await pages.basePage.captureDocumentUrl(sharedContext, () => pages.orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ELB');

    console.log(`✔ "ELB" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/Battery/batteryLithiumIonContained.spec.ts --project="Google Chrome" --headed
