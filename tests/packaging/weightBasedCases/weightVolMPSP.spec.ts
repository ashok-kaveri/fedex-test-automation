import ShopifyOrderUploader from '../../../src/helpers/createOrder';
import { test, expect } from '../../../src/setup/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Weight based - Kilogram and centimetre- Volumetric weight - Max weight [Multiple same prod and single package] - product in inches -  Manual', () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  const maxWeight = 50;
  const inputDimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm' | 'ft' | 'mt';
  } = {
    length: 8,
    width: 10,
    height: 12,
    unit: 'in',
  };

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

  test('1. Verify Weight Based Packaging', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple packaging product');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.saveProduct();
    await pages.productSummaryPage.clickBackButton();
    await pages.productPage.searchAndSelectProduct('variable 1 S');
    await pages.productsPage.addProductDimensions(inputDimensions);
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
    await pages.packagingSettingsPage.setCheckbox('Use Volumetric Weight For Package Generation', true);
    await pages.packagingSettingsPage.setMaxWeight(maxWeight);
    await pages.packagingSettingsPage.setCheckbox('Use Longest Side Of The Product As Package Dimensions', false);
    await pages.packagingSettingsPage.savePackagingDetails();
    await pages.packagingSettingsPage.expectToast('Updated');
  });

  test('2. Order Creation with multiple products', async () => {
    const orderID = (await orderUploader.uploadOrderWithMultipleProducts([
      { productType: 'simple', productIndexes: [0], quantities: [1] },
      { productType: 'variable', productIndexes: [0], quantities: [1] },
    ])) as string;
    console.log('Order ID:', orderID);
    expect(orderID).toBeTruthy();
    sharedOrderID = orderID;
  });

  test('3.Validate Dimensions and weight in Rate logs', async ({ pages }) => {
    test.setTimeout(60000);
    //Prod 1
    await pages.shopifyProductsSummary.selectShopifyMenuOption('Products');
    await pages.shopifyProductPage.openProductSummeryPage('Simple packaging product');
    const productWeight1 = Number(await pages.shopifyProductsSummary.getProductWeight());
    //Prod 2
    await pages.shopifyProductsSummary.selectShopifyMenuOption('Products');
    await pages.shopifyProductPage.openVariantProduct('variable 1', 'S');
    const productWeight2 = Number(await pages.shopifyProductsSummary.getProductWeight());

    await pages.shopifyAdmin.navigateToOrderInShopifyAndClickGenerateLabel(sharedOrderID);
    const volumetricWeight = pages.shopifyAdmin.calculateVolumetricWeight(inputDimensions.length, inputDimensions.width, inputDimensions.height, inputDimensions.unit);
    const expectedFinalWeight = Math.max(productWeight1, volumetricWeight) + Math.max(productWeight2, volumetricWeight);
    console.log(`Product Weight: ${productWeight1}, Volumetric Weight: ${volumetricWeight}, Expected Final Weight: ${expectedFinalWeight}`);
    console.log(`Product Weight: ${productWeight2}, Volumetric Weight: ${volumetricWeight}, Expected Final Weight: ${expectedFinalWeight}`);

    await pages.manualLabelPage.openRateRequestLog();
    const actualweight = await pages.manualLabelPage.getTotalPackageWeightFromRequestLog();
    expect(Math.floor(actualweight)).toBeCloseTo(Math.floor(expectedFinalWeight));
    await pages.manualLabelPage.clickGenerateLabelButtonInManualLabelGenerationPage();
    await expect(pages.orderSummaryPage.labelGeneratedStatus).toBeVisible({ timeout: 70000 });
  });
});
