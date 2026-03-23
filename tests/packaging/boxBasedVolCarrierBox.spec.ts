import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { test, expect } from '../../src/setup/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Box based - Kilogram and centimetre - Pre-packed product - product in cm - Manual', () => {
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

  test('1. Verify Box Packaging', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shippingPage.navigateToProductsPage();
    await pages.productPage.searchAndSelectProduct('Simple packaging product');
    await pages.productsPage.addProductDimensions(inputDimensions);
    await pages.productsPage.setSupplementaryOption('Is this product pre-packed?', true);
    await pages.productsPage.saveProduct();
    await pages.packagingSettingsPage.selectAppMenu('settings');
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Packing Method', 'Box Based');
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Weight And Dimensions Unit', 'Kilograms & Centimeters');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'Save');
    await pages.packagingSettingsPage.expectToast('Updated');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'more settings');
    await expect(pages.packagingSettingsPage.skeletonLoader).toBeHidden();
    const selectedPackingMethod = await pages.packagingSettingsPage.getSelectedPackingMethod();
    expect(selectedPackingMethod).toBe('Box Based');
    await pages.packagingSettingsPage.setCheckbox('Use Volumetric Weight For Package Generation', false);
    await pages.packagingSettingsPage.savePackagingDetails();
    await pages.packagingSettingsPage.expectToast('Updated');

    // await pages.packagingSettingsPage.expectToast('Updated');
    // await pages.packagingSettingsPage.setDefaultProductDimensions({
    //   length: 20,
    //   width: 15,
    //   height: 10,
    //   weight: 2500,
    //   unit: 'ft',
    // });
    // await pages.packagingSettingsPage.clickSettingsButtonUsingHeading('Default product dimensions and weight', 'Save');
    // await expect(pages.packagingSettingsPage.successMessage('Product Settings Updated')).toBeVisible({ timeout: 5000 });
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'more settings');
    // // await pages.packagingSettingsPage.addDimensionsForFreight({
    // //   length: 25,
    // //   width: 30,
    // //   height: 40,
    // // });
    await expect(pages.packagingSettingsPage.skeletonLoader).toBeHidden();
    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Packing Method', 'Box Packing');
    await pages.packagingSettingsPage.setCheckbox('Use Volumetric Weight For Package Generation', false);
    await pages.packagingSettingsPage.setCheckbox('Do You Stack Products In Boxes?', true);
    // // await pages.packagingSettingsPage.setAdditionalWeight(true);
    // // await pages.packagingSettingsPage.fillInputByLabel('Max Weight', 10);
    // // await pages.packagingSettingsPage.fillInputByLabel('Length', 10);
    // // await pages.packagingSettingsPage.settingsDropDownUsingLabel('Additional Weight Options', 'Constant');
    // // await pages.packagingSettingsPage.fillInputByLabel('Constant Weight To Be Added', 10);
    // await pages.packagingSettingsPage.restoreFedExBoxes();
    // await pages.packagingSettingsPage.keepOnlyBoxes({ 'FedEx® Small Box': [1] });
    // // await pages.packagingSettingsPage.addCustomBox(customBoxData);
    // // await expect(pages.packagingSettingsPage.getBoxRowByName(customBoxData.name)).toBeVisible();
    // await pages.packagingSettingsPage.savePackagingDetails();
  });
});
