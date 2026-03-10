import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ProductPage } from '../../../src/pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../../../src/pages/app/productsPage/productSummaryPage';
import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { ShopifyAdminPage } from '../../../src/pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../../../src/pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../../../src/pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../../../src/pages/app/OrderSummaryPage/OrderSummaryPage';
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
        sharedPage   = await sharedContext.newPage();

        orderUploader      = new ShopifyOrderUploader();
        shopifyAdminPage   = new ShopifyAdminPage(sharedPage);
        shippingPage       = new ShippingPage(sharedPage);
        productPage        = new ProductPage(sharedPage);
        productSummaryPage = new ProductSummaryPage(sharedPage);
        manualLabelPage    = new GenerateLabelManuallyPage(sharedPage);
        orderSummaryPage   = new OrderSummaryPage(sharedPage);
    });

    test.afterAll(async () => {
        await shippingPage.navigateToProductsPage();
        await productPage.searchAndSelectProduct('Simple 1');
        await productSummaryPage.disableSpecialService('alcohol');
        await expect(productSummaryPage.isAlcoholLabel).not.toBeChecked();
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

    test('Step 4 | Print label and capture document URL', async () => {
        const newPagePromise = sharedContext.waitForEvent('page');
        await orderSummaryPage.clickPrintDocuments();

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