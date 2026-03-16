import { BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { test, expect } from '../../../src/setup/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Adult Signature', () => {
  // ── Shared State ──────────────────────────────────────────────────────────
  let sharedOrderID: string;
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
  });

  test.afterAll(async ({ pages }) => {
    await pages.shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('BLAZER');
    await productSummaryPage.updateProductSignature('AS_PER_THE_GENERAL_SETTINGS');
    expect(await productSummaryPage.getSelectedSignatureLabel()).toBe('As Per The General Settings');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Adult Signature on product', async ({ pages }) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('BLAZER');
    await productSummaryPage.updateProductSignature('ADULT');

    const selectedLabel = await productSummaryPage.getSelectedSignatureLabel();
    expect(selectedLabel).toBe('Adult Signature Required');

    console.log(`✔ Signature type set to: "${selectedLabel}"`);
  });

  test('Step 2 | Create order via API with adult-signature product', async () => {
    test.setTimeout(0);

    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify XML signature option', async ({ pages }) => {
    test.setTimeout(0);

    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await pages.manualLabelPage.generatePackages();
    await pages.manualLabelPage.getShippingRates();

    const xmlContent = await pages.manualLabelPage.verifySignatureOptionInXmlRequest();
    expect(xmlContent).toContain('ADULT');
    console.log('✔ XML contains expected signature option: ADULT');

    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label, capture URL and verify PDF text', async ({ pages }) => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await pages.orderSummaryPage.captureDocumentUrl(sharedContext, () => pages.orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ASR');

    console.log(`✔ "ASR" text confirmed in FedEx label`);
  });
});

// npx playwright test tests/product_Special_Service/signatureTypes/adultSignature.spec.ts --project="Google Chrome" --headed
