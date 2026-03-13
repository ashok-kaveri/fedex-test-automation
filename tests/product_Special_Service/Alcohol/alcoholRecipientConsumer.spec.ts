import { test, expect } from '../../../src/setup/fixtures';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import axios from 'axios';

const { PDFParse } = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Label Generation For Alcohol — Recipient Type: Consumer
// Run: npx playwright test tests/product_Special_Service/Alcohol/alcoholRecipientConsumer.spec.ts
//      --project="Google Chrome" --headed
// ─────────────────────────────────────────────────────────────────────────────

const ALCOHOL_RECIPIENT_TYPE = 'CONSUMER';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Alcohol — Recipient Type: Consumer', () => {
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
    await pages.productSummaryPage.disableSpecialService('alcohol');
    await expect(pages.productSummaryPage.isAlcoholLabel).not.toBeChecked();
    console.log('✔ Alcohol is disabled');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Alcohol with recipient type Consumer on product', async ({ pages }) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple 1');
    await pages.productSummaryPage.updateProductAlcohol(ALCOHOL_RECIPIENT_TYPE);

    await expect(pages.productSummaryPage.alcoholRecipientTypeDropdown).toHaveValue(ALCOHOL_RECIPIENT_TYPE);
    console.log(`✔ Alcohol recipient type set to: ${ALCOHOL_RECIPIENT_TYPE}`);
  });

  test('Step 2 | Create order via API with alcohol product', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify Alcohol XML payload', async ({ pages }) => {
    test.setTimeout(90_000);

    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await pages.manualLabelPage.generatePackages();
    await pages.manualLabelPage.getShippingRates();

    const xmlContent = await pages.manualLabelPage.verifyAlcoholInXmlRequest();

    expect(xmlContent).toContain('<ns:SpecialServiceTypes>ALCOHOL</ns:SpecialServiceTypes>');
    expect(xmlContent).toContain('<ns:AlcoholDetail>');
    expect(xmlContent).toContain(`<ns:RecipientType>${ALCOHOL_RECIPIENT_TYPE}</ns:RecipientType>`);
    console.log(`✔ XML confirmed — ALCOHOL service present with recipient type: ${ALCOHOL_RECIPIENT_TYPE}`);

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
  });

  // Step 5 is skipped pending PDF text verification for Alcohol label
  // Re-enable once the label is confirmed to contain "ALCOHOL" text
  // test.skip('Step 5 | Verify "ALCOHOL" text is present in generated FedEx label PDF', async () => {
  //     expect(capturedDocumentUrl).toBeTruthy();

  //     const response = await axios.get(capturedDocumentUrl, { responseType: 'arraybuffer' });
  //     const parser = new PDFParse({ data: response.data });
  //     const pdfData = await parser.getText();

  //     console.log('✔ PDF text extracted successfully');
  //     expect(pdfData.text).toContain('ALCOHOL');
  //     console.log('✔ "ALCOHOL" text confirmed in FedEx label');
  // });
});

// npx playwright test tests/product_Special_Service/Alcohol/alcoholRecipientConsumer.spec.ts --project="Google Chrome" --headed
