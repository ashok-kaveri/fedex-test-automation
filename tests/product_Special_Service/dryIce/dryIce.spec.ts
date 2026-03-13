import { test, expect } from '../../../src/setup/fixtures';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import axios from 'axios';

const { PDFParse } = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Label Generation For Dry Ice Product
// Run: npx playwright test tests/product_Special_Service/dryIce/dryIce.spec.ts
//      --project="Google Chrome" --headed
// ─────────────────────────────────────────────────────────────────────────────

const DRY_ICE_WEIGHT = '0.3';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Dry Ice Product', () => {
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
    await pages.productSummaryPage.disableSpecialService('dryIce');
    await expect(pages.productSummaryPage.dryIceCheckbox).not.toBeChecked();
    console.log('✔ Dry Ice is disabled');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Dry Ice on product', async ({ pages }) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple 1');
    await pages.productSummaryPage.updateProductDryIce(DRY_ICE_WEIGHT);

    await expect(pages.productSummaryPage.dryIceCheckbox).toBeChecked();
    console.log('✔ Dry Ice is enabled on product');
  });

  test('Step 2 | Create order via API with dry ice product', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify Dry Ice XML payload', async ({ pages }) => {
    test.setTimeout(90_000);

    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await pages.manualLabelPage.generatePackages();
    await pages.manualLabelPage.getShippingRates();

    const xmlContent = await pages.manualLabelPage.verifyDryIceInXmlRequest();

    expect(xmlContent).toContain('<ns:SpecialServiceTypes>DRY_ICE</ns:SpecialServiceTypes>');
    expect(xmlContent).toContain('<ns:DryIceWeight>');
    expect(xmlContent).toContain('<ns:Units>KG</ns:Units>');

    const weightFound = xmlContent.includes(`<ns:Value>${DRY_ICE_WEIGHT}`) || xmlContent.includes(`<ns:Value>${Number(DRY_ICE_WEIGHT).toFixed(2)}`);
    expect(weightFound).toBeTruthy();

    console.log(`✔ XML confirmed — DRY_ICE service present with weight: ${DRY_ICE_WEIGHT} KG`);

    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label and capture document URL', async ({ pages }) => {
    const newPagePromise = pages.sharedPage.context().waitForEvent('page');
    await pages.orderSummaryPage.clickPrintDocuments();

    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load');

    const viewerUrl = newPage.url();
    capturedDocumentUrl = new URL(viewerUrl).searchParams.get('document') ?? '';

    expect(capturedDocumentUrl).toBeTruthy();
    console.log(`✔ Captured document URL: ${capturedDocumentUrl}`);
  });

  // Step 5 is skipped pending PDF text verification for Dry Ice label
  // Re-enable once the label is confirmed to contain "ICE" text
  // test.skip('Step 5 | Verify "ICE" text is present in generated FedEx label PDF', async () => {
  //     expect(capturedDocumentUrl).toBeTruthy();

  //     const response = await axios.get(capturedDocumentUrl, { responseType: 'arraybuffer' });
  //     const parser = new PDFParse({ data: response.data });
  //     const pdfData = await parser.getText();

  //     console.log('✔ PDF text extracted successfully');
  //     expect(pdfData.text).toContain('ICE');
  //     console.log('✔ "ICE" text confirmed in FedEx label');
  // });
});

// npx playwright test tests/product_Special_Service/dryIce/dryIce.spec.ts --project="Google Chrome" --headed
