import { test, expect } from '../../../src/setup/fixtures';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { BrowserContext } from '@playwright/test';

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

    expect(xmlContent).toContain('DRY_ICE');
    expect(xmlContent).toContain('DryIceWeight');
    expect(xmlContent).toContain('KG');

    const weightFound = xmlContent.includes(`${DRY_ICE_WEIGHT}`) || xmlContent.includes(`${Number(DRY_ICE_WEIGHT).toFixed(2)}`);
    // eslint-disable-next-line
    expect(weightFound).toBeTruthy();

    console.log(`✔ XML confirmed — DRY_ICE service present with weight: ${DRY_ICE_WEIGHT} KG`);

    await pages.manualLabelPage.selectFirstShippingService();
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await pages.orderSummaryPage.verifyLabelGenerated();
  });

  test('Step 4 | Print label, capture URL and verify PDF text', async ({ pages }) => {
    test.setTimeout(0);

    const { documentUrl, pdfText } = await pages.orderSummaryPage.captureDocumentUrl(sharedContext, () => pages.orderSummaryPage.clickPrintDocuments());

    expect(documentUrl).toBeTruthy();
    expect(pdfText).toContain('ICE');

    console.log(`✔ "ICE" text confirmed in FedEx label`);
    console.log(`✔ Final document URL: ${documentUrl}`);
  });
});

// npx playwright test tests/product_Special_Service/dryIce/dryIce.spec.ts --project="Google Chrome" --headed
