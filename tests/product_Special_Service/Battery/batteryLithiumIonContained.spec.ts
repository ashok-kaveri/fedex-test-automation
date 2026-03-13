import { test, expect } from '../../../src/setup/fixtures';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import axios from 'axios';

const { PDFParse } = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Label Generation For Lithium Ion (Contained In Equipment)
// Run: npx playwright test tests/product_Special_Service/Battery/batteryLithiumIonContained.spec.ts
//      --project="Google Chrome" --headed
// ─────────────────────────────────────────────────────────────────────────────

const BATTERY_MATERIAL = 'LITHIUM_ION';
const BATTERY_PACKING = 'CONTAINED_IN_EQUIPMENT';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Lithium Ion (Contained In Equipment)', () => {
  // ── Shared State ──────────────────────────────────────────────────────────
  let sharedOrderID: string;
  let capturedDocumentUrl: string = '';

  // ── Page Objects ──────────────────────────────────────────────────────────
  let orderUploader: ShopifyOrderUploader;

  // ── Hooks ─────────────────────────────────────────────────────────────────

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
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

    expect(xmlContent).toContain('<ns:SpecialServiceTypes>BATTERY</ns:SpecialServiceTypes>');
    expect(xmlContent).toContain('<ns:BatteryDetails>');
    expect(xmlContent).toContain(`<ns:Material>${BATTERY_MATERIAL}</ns:Material>`);
    expect(xmlContent).toContain(`<ns:Packing>${BATTERY_PACKING}</ns:Packing>`);
    expect(xmlContent).toContain('<ns:RegulatorySubType>IATA_SECTION_II</ns:RegulatorySubType>');
    console.log(`✔ XML confirmed — BATTERY service present with ${BATTERY_MATERIAL} / ${BATTERY_PACKING}`);

    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label and capture document URL', async ({ pages }) => {
    const newPagePromise = pages.sharedPage.context().waitForEvent('page');
    await pages.orderSummaryPage.clickPrintDocuments();

    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load');

    capturedDocumentUrl = new URL(newPage.url()).searchParams.get('document') ?? '';

    expect(capturedDocumentUrl).toBeTruthy();
    console.log(`✔ Captured document URL: ${capturedDocumentUrl}`);
    await newPage.close();
  });

  test('Step 5 | Verify "ELB" text is present in generated FedEx label PDF', async () => {
    expect(capturedDocumentUrl).toBeTruthy();

    const response = await axios.get(capturedDocumentUrl, { responseType: 'arraybuffer' });
    const parser = new PDFParse({ data: response.data });
    const pdfData = await parser.getText();

    console.log('✔ PDF text extracted successfully');
    expect(pdfData.text).toContain('ELB');
    console.log('✔ "ELB" text confirmed in FedEx label');
  });
});

// npx playwright test tests/product_Special_Service/Battery/batteryLithiumIonContained.spec.ts --project="Google Chrome" --headed
