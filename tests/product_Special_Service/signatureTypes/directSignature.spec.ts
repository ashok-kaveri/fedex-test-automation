import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../../src/pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../../../src/pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
// import axios from 'axios';
// const { PDFParse } = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite: Label Generation For Direct Signature
// Run: npx playwright test tests/product_Special_Service/signatureTypes/directSignature.spec.ts
//      --project="Google Chrome" --headed
// ─────────────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Direct Signature', () => {
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
    await productSummaryPage.updateProductSignature('AS_PER_THE_GENERAL_SETTINGS');
    expect(await productSummaryPage.getSelectedSignatureLabel()).toBe('As Per The General Settings');
    await sharedPage?.close();
    await sharedContext?.close();
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Direct Signature on product', async () => {
    test.setTimeout(120_000);

    await shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('Simple 1');
    await productSummaryPage.updateProductSignature('DIRECT');

    const selectedLabel = await productSummaryPage.getSelectedSignatureLabel();
    expect(selectedLabel).toBe('Direct Signature Required');

    console.log(`✔ Signature type set to: "${selectedLabel}"`);
  });

  test('Step 2 | Create order via API with direct-signature product', async () => {
    test.setTimeout(0);

    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify XML signature option', async () => {
    test.setTimeout(0);

    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await manualLabelPage.generatePackages();
    await manualLabelPage.getShippingRates();

    const xmlContent = await manualLabelPage.verifySignatureOptionInXmlRequest();
    expect(xmlContent).toContain('<ns:OptionType>DIRECT</ns:OptionType>');
    console.log('✔ XML contains expected signature option: DIRECT');

    await manualLabelPage.selectFirstShippingService();
    await manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label, capture URL and verify PDF text', async () => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await orderSummaryPage.captureDocumentUrl(sharedContext, () => orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('DSR');

    console.log(`✔ "DSR" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/signatureTypes/directSignature.spec.ts --project="Google Chrome" --headed
