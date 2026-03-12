import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../../src/pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../../../src/pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../../src/pages/app/OrderSummaryPage/OrderSummaryPage';

const ALCOHOL_RECIPIENT_TYPE = 'LICENSEE';

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Alcohol — Recipient Type: Consumer', () => {
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
    await productSummaryPage.disableSpecialService('alcohol');
    expect(await productSummaryPage.isAlcoholCheckbox.isChecked()).toBe(false);
    console.log('✔ Alcohol is disabled');
    await sharedPage?.close();
    await sharedContext?.close();
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('Step 1 | Enable Alcohol with recipient type Consumer on product', async () => {
    test.setTimeout(120_000);

    await shippingPage.navigateToProductsPage();
    await productPage.searchAndSelectProduct('Simple 1');
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

  test('Step 3 | Manually generate label and verify Alcohol XML payload', async () => {
    test.setTimeout(90_000);

    await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await manualLabelPage.waitUntilGeneratePackageButtonVisible();
    await manualLabelPage.generatePackages();
    await manualLabelPage.getShippingRates();

    const xmlContent = await manualLabelPage.verifyAlcoholInXmlRequest();

    expect(xmlContent).toContain('<ns:SpecialServiceTypes>ALCOHOL</ns:SpecialServiceTypes>');
    expect(xmlContent).toContain('<ns:AlcoholDetail>');
    expect(xmlContent).toContain(`<ns:RecipientType>${ALCOHOL_RECIPIENT_TYPE}</ns:RecipientType>`);
    console.log(`✔ XML confirmed — ALCOHOL service present with recipient type: ${ALCOHOL_RECIPIENT_TYPE}`);

    await manualLabelPage.selectFirstShippingService();
    await manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label, capture URL and verify PDF text', async () => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await orderSummaryPage.captureDocumentUrl(sharedContext, () => orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ALCOHOL');

    console.log(`✔ "ALCOHOL" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/Alcohol/alcoholRecipientLicensee.spec.ts --project="Google Chrome" --headed
