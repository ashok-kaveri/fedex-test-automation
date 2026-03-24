import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { test, expect } from '../../../src/setup/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Weight based - Kilogram and centimetre - Pre-packed product - product in cm - Manual', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  const inputDimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm' | 'ft' | 'mt';
  } = {
    length: 7,
    width: 8,
    height: 9,
    unit: 'cm',
  };

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

  test('1. Verify Weight Based Packaging', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple packaging product');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.setSupplementaryOption('Is this product pre-packed?', true);
    await pages.productsPage.saveProduct();
    await pages.packagingSettingsPage.selectAppMenu('settings');
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Packing Method', 'Weight Based');
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Weight And Dimensions Unit', 'Kilograms & Centimeters');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'Save');
    await pages.packagingSettingsPage.expectToast('Updated');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'more settings');
    await expect(pages.packagingSettingsPage.skeletonLoader).toBeHidden();
    const selectedPackingMethod = await pages.packagingSettingsPage.getSelectedPackingMethod();
    expect(selectedPackingMethod).toBe('Weight Based');
    await pages.packagingSettingsPage.setCheckbox('Use Volumetric Weight For Package Generation', false);
    await pages.packagingSettingsPage.savePackagingDetails();
    await pages.packagingSettingsPage.expectToast('Updated');
  });

  test('2. Order Creation', async () => {
    const orderID = (await orderUploader.uploadOrder()) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('3.Validate Dimensions and weight in Rate logs', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyProductsSummary.selectShopifyMenuOption('Products');
    await pages.shopifyProductPage.openProductSummeryPage('Simple packaging product');
    const productWeight = Number(await pages.shopifyProductsSummary.getProductWeight());
    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.openRateRequestLog();
    const actualweight = await pages.manualLabelPage.validateDimensionsFromLogs(inputDimensions);
    expect(actualweight).toBe(productWeight);
    console.log(`Product Weight: ${productWeight}`);
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await expect(pages.orderSummaryPage.labelGeneratedStatus).toBeVisible({ timeout: 70000 });
  });

  test.afterAll('Cleanup: Disable prepacked setting from the product page', async ({ pages }) => {
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple packaging product');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.setSupplementaryOption('Is this product pre-packed?', false);
    await pages.productsPage.saveProduct();
    await pages.productPage.expectToast('Products Successfully Saved');
  });
});
