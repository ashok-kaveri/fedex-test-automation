import { test, expect } from '../../../src/setup/fixtures';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { BrowserContext } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Label Generation For Lithium Metal (Packed With Equipment)
// Run: npx playwright test tests/product_Special_Service/Battery/batteryLithiumIonContained.spec.ts
//      --project="Google Chrome" --headed
// ─────────────────────────────────────────────────────────────────────────────

const BATTERY_MATERIAL = 'LITHIUM_METAL';
const BATTERY_PACKING = 'PACKED_WITH_EQUIPMENT';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Lithium Ion (Contained In Equipment)', () => {
  // ── Shared State ──────────────────────────────────────────────────────────
  let sharedOrderID: string;
  let sharedContext: BrowserContext;

  // ── Page Objects ──────────────────────────────────────────────────────────
  let orderUploader: ShopifyOrderUploader;

  // ── Hooks ─────────────────────────────────────────────────────────────────

  test.beforeAll(async ({ pages }) => {
    orderUploader = new ShopifyOrderUploader();
    sharedContext = pages.sharedPage.context();
  });

  test.afterAll(async ({ pages }) => {
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple 1');
    await pages.productSummaryPage.disableSpecialService('battery');
    await expect(pages.productSummaryPage.isBatteryLabel).not.toBeChecked();
    console.log('✔ Battery is disabled');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Lithium Ion (Contained In Equipment) battery on product', async ({ pages }) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple 1');
    await pages.productSummaryPage.updateProductBattery(BATTERY_MATERIAL, BATTERY_PACKING);

    await expect(pages.productSummaryPage.batteryMaterialTypeDropdown).toHaveValue(BATTERY_MATERIAL);
    await expect(pages.productSummaryPage.batteryPackingTypeDropdown).toHaveValue(BATTERY_PACKING);
    console.log(`✔ Battery settings updated — Material: ${BATTERY_MATERIAL}, Packing: ${BATTERY_PACKING}`);
  });

  test('Step 2 | Create order via API with battery product', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify Battery XML payload', async ({ pages }) => {
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

  test('Step 4 | Print label, capture URL and verify PDF text', async ({ pages }) => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await pages.orderSummaryPage.captureDocumentUrl(sharedContext, () => pages.orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ELB');

    console.log(`✔ "ELB" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/Battery/batteryLithiumMetalPacked.spec.ts --project="Google Chrome" --headed
