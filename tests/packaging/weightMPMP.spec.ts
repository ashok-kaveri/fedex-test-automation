import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { test, expect } from '../../src/setup/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Weight Based Packaging with - Multiple product in Multiple package with Additional weight and max weight', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  const addOnweight = 3;
  const inputDimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm' | 'ft' | 'mt';
  } = {
    length: 12,
    width: 10,
    height: 5,
    unit: 'in',
  };

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

  test('1. Verify Weight Based Packaging', async ({ pages }) => {
    test.setTimeout(60000);

    //Edit Product Dimensions
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple packaging product');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.saveProduct();
    await pages.productSummaryPage.clickBackButton();
    await pages.productPage.searchAndSelectProduct('variable 1 S');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.saveProduct();
    await pages.productSummaryPage.clickBackButton();
    await pages.productPage.searchAndSelectProduct('variable 1 S');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.saveProduct();

    await pages.packagingSettingsPage.selectAppMenu('settings');
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Packing Method', 'Weight Based');
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Weight And Dimensions Unit', 'Pounds & Inches');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'Save');
    await pages.packagingSettingsPage.expectToast('Updated');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'more settings');
    await expect(pages.packagingSettingsPage.skeletonLoader).toBeHidden();
    const selectedPackingMethod = await pages.packagingSettingsPage.getSelectedPackingMethod();
    expect(selectedPackingMethod).toBe('Weight Based');
    await pages.packagingSettingsPage.setCheckbox('Use Volumetric Weight For Package Generation', false);
    await pages.packagingSettingsPage.setMaxWeight(5);
    await pages.packagingSettingsPage.setAdditionalWeight(true);
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Additional Weight Options', 'Constant');
    await pages.packagingSettingsPage.fillInputByLabel('Constant Weight To Be Added', addOnweight);
    await pages.packagingSettingsPage.savePackagingDetails();
    await pages.packagingSettingsPage.expectToast('Updated');
  });

  test('2. Order Creation with multiple products', async () => {
    const orderID = (await orderUploader.uploadOrderWithMultipleProducts([
      { productType: 'simple', productIndexes: [0], quantities: [2] },
      { productType: 'variable', productIndexes: [0], quantities: [2] },
      { productType: 'variable', productIndexes: [1], quantities: [2] },
    ])) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('3.Validate Dimensions and weight in Rate logs', async ({ pages }) => {
    test.setTimeout(100000);
    //Prod 1
    await pages.shopifyProductsSummary.selectShopifyMenuOption('Products');
    await pages.shopifyProductPage.openProductSummeryPage('Simple packaging product');
    const productWeight1 = Number(await pages.shopifyProductsSummary.getProductWeight());
    //Prod 2
    await pages.shopifyProductsSummary.selectShopifyMenuOption('Products');
    await pages.shopifyProductPage.openVariantProduct('variable 1', 'S');
    const productWeight2 = Number(await pages.shopifyProductsSummary.getProductWeight());
    //Prod 3
    await pages.shopifyProductsSummary.selectShopifyMenuOption('Products');
    await pages.shopifyProductPage.openVariantProduct('variable 1', 'M');
    const productWeight3 = Number(await pages.shopifyProductsSummary.getProductWeight());
    const expectedFinalWeight = 2 * (productWeight1 + addOnweight) + 2 * (productWeight2 + addOnweight) + 2 * (productWeight3 + addOnweight);
    console.log(expectedFinalWeight);

    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    await pages.manualLabelPage.openRateRequestLog();
    const actualweight = await pages.manualLabelPage.getTotalPackageWeightFromRequestLog();
    expect(Math.floor(actualweight)).toBeCloseTo(Math.floor(expectedFinalWeight));
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await expect(pages.orderSummaryPage.labelGeneratedStatus).toBeVisible({ timeout: 100000 });
  });

  test.afterAll('Cleanup: Disable additional weight settings', async ({ pages }) => {
    await pages.packagingSettingsPage.selectAppMenu('settings');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'more settings');
    await expect(pages.packagingSettingsPage.skeletonLoader).toBeHidden();
    await pages.packagingSettingsPage.setAdditionalWeight(false);
    await pages.packagingSettingsPage.savePackagingDetails();
    await pages.packagingSettingsPage.expectToast('Updated');
  });
});
