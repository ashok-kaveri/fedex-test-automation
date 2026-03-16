import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { test, expect } from '../../../src/setup/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Indirect Signature', () => {
  // ── Shared State ──────────────────────────────────────────────────────────
  let sharedOrderID: string;

  // ── Page Objects ──────────────────────────────────────────────────────────
  let orderUploader: ShopifyOrderUploader;

  // ── Hooks ─────────────────────────────────────────────────────────────────

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

  test.afterAll(async ({ pages }) => {
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('BLAZER');
    await pages.productSummaryPage.updateProductSignature('AS_PER_THE_GENERAL_SETTINGS');
    expect(await pages.productSummaryPage.getSelectedSignatureLabel()).toBe('As Per The General Settings');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Indirect Signature on product', async ({ pages }) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('BLAZER');
    await pages.productSummaryPage.updateProductSignature('INDIRECT');

    const selectedLabel = await pages.productSummaryPage.getSelectedSignatureLabel();
    expect(selectedLabel).toBe('Indirect Signature Required');

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
    expect(xmlContent).toContain('INDIRECT');
    console.log('✔ XML contains expected signature option: INDIRECT');

    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });
  /*
  test('Step 4 | Print label, capture URL and verify PDF text', async ({pages}) => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await pages.orderSummaryPage.captureDocumentUrl(sharedContext, () => pages.orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ISR');

    console.log(`✔ "ISR" text confirmed in FedEx label`);  
    console.log(`✔ Final document URL: ${documentUrl}`);
  });*/
});

// npx playwright test tests/product_Special_Service/signatureTypes/indirectSignature.spec.ts --project="Google Chrome" --headed
