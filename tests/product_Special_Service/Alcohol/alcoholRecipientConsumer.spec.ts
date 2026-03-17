import { Page, BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { test, expect } from '../../../src/setup/fixtures';

const ALCOHOL_RECIPIENT_TYPE = 'CONSUMER';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Alcohol — Recipient Type: Consumer', () => {
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
    await productSummaryPage.disableSpecialService('alcohol');
    expect(await productSummaryPage.isAlcoholCheckbox.isChecked()).toBe(false);
    console.log('✔ Alcohol is disabled');
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Alcohol with recipient type Consumer on product', async ({pages}) => {
    test.setTimeout(120_000);

    await pages.shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('BLAZER');
    await productSummaryPage.updateProductAlcohol(ALCOHOL_RECIPIENT_TYPE);

    await expect(productSummaryPage.alcoholRecipientTypeDropdown).toHaveValue(ALCOHOL_RECIPIENT_TYPE);
    console.log(`✔ Alcohol recipient type set to: ${ALCOHOL_RECIPIENT_TYPE}`);
  });

  test('Step 2 | Create order via API with alcohol product', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    expect(orderID).toBeTruthy();

    sharedOrderID = orderID;
    console.log(`✔ Order created — ID: ${sharedOrderID}`);
  });

  test('Step 3 | Manually generate label and verify Alcohol XML payload', async ({pages}) => {
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
