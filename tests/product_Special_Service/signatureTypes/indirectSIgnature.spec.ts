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
// Test Suite: Label Generation For Indirect Signature
// Run: npx playwright test tests/product_Special_Service/signatureTypes/indirectSignature.spec.ts
//      --project="Google Chrome" --headed
// ─────────────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('Label Generation For Indirect Signature', () => {

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
        await sharedPage?.close();
        await sharedContext?.close();
    });

    // ── Tests ─────────────────────────────────────────────────────────────────

    test('Step 1 | Enable Indirect Signature on product', async () => {
        test.setTimeout(120_000);

        await shippingPage.navigateToProductsPage();
        await productPage.searchAndSelectProduct('Simple 1');
        await productSummaryPage.updateProductSignature('INDIRECT');

        const selectedLabel = await productSummaryPage.getSelectedSignatureLabel();
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

    test('Step 3 | Manually generate label and verify XML signature option', async () => {
        test.setTimeout(0);

        await shopifyAdminPage.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
        await manualLabelPage.waitUntilGeneratePackageButtonVisible();
        await manualLabelPage.generatePackages();
        await manualLabelPage.getShippingRates();

        const xmlContent = await manualLabelPage.verifySignatureOptionInXmlRequest();
        expect(xmlContent).toContain('<ns:OptionType>INDIRECT</ns:OptionType>');
        console.log('✔ XML contains expected signature option: INDIRECT');

        await manualLabelPage.selectFirstShippingService();
        await manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
        await orderSummaryPage.verifyLabelGenerated();
    });

    test('Step 4 | Print label and capture document URL', async () => {
        const newPagePromise = sharedContext.waitForEvent('page');
        await orderSummaryPage.clickPrintDocuments();

        const newPage = await newPagePromise;
        await newPage.waitForLoadState('load');

        const viewerUrl = newPage.url();
        const url = new URL(viewerUrl);
        capturedDocumentUrl = url.searchParams.get('document') ?? '';

        expect(capturedDocumentUrl).toBeTruthy();
        console.log(`✔ Captured document URL: ${capturedDocumentUrl}`);
    });

    //We can not verify the ISR text in the generated FedEx label PDF as it will be not displayed in the label

    // test('Step 5 | Verify "ISR" text is present in generated FedEx label PDF', async () => {
    //     test.setTimeout(0);

    //     expect(capturedDocumentUrl).toBeTruthy();

    //     const response = await axios.get(capturedDocumentUrl, { responseType: 'arraybuffer' });
    //     const parser = new PDFParse({ data: response.data });
    //     const pdfData = await parser.getText();

    //     console.log('✔ PDF text extracted successfully');
    //     expect(pdfData.text).toContain('ISR');
    //     console.log('✔ "ISR" text confirmed in FedEx label');
    // });

});

// npx playwright test tests/product_Special_Service/signatureTypes/indirectSignature.spec.ts --project="Google Chrome" --headed