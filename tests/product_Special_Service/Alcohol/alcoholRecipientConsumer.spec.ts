import { test, expect,  } from '../../../src/setup/fixtures';
import { Page, BrowserContext } from '@playwright/test';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';


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
    expect(xmlContent).toContain('ALCOHOL');
    expect(xmlContent).toContain('alcoholDetail');
    expect(xmlContent).toContain(ALCOHOL_RECIPIENT_TYPE);
    console.log(`✔ JSON confirmed — ALCOHOL service present with recipient type: ${ALCOHOL_RECIPIENT_TYPE}`);

    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label, capture URL and verify PDF text', async ({pages}) => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await pages.basePage.captureDocumentUrl(sharedContext, () => pages.orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ALCOHOL');

    console.log(`✔ "ALCOHOL" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/Alcohol/alcoholRecipientConsumer.spec.ts --project="Google Chrome" --headed
