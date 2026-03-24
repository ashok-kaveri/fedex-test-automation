import { test, expect } from '../../src/setup/fixtures';

const store = process.env.STORE;
// const customBoxData = {
//   name: 'Test Box',
//   inner: {
//     length: 10,
//     width: 10,
//     height: 10,
//   },
//   outer: {
//     length: 12,
//     width: 12,
//     height: 12,
//   },
//   weight: {
//     empty: 1,
//     max: 20,
//   },
// };

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Box Packaging Flow', { tag: "@regression" }, () => {
  // let sharedOrderID: string;
  // let orderUploader: ShopifyOrderUploader;

  //   test.beforeAll(async () => {
  //     orderUploader = new ShopifyOrderUploader();
  //     const orderID = await orderUploader.uploadOrder();
  //     if (!orderID) throw new Error('Failed to create Shopify order');
  //     sharedOrderID = orderID;
  //     console.log(`Order created: ${sharedOrderID}`);
  //   });

  test('1. Verify Box Packaging', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToStore(store);
    await pages.packagingSettingsPage.clickAppButton();
    await pages.packagingSettingsPage.selectAppMenu('settings');
    // await pages.packagingSettingsPage.settingsDropDownUsingLabel('Packing Method', 'P1');

    await pages.packagingSettingsPage.settingsDropDownUsingLabel('Weight And Dimensions Unit', 'kgs_cm');
    await pages.packagingSettingsPage.clickSettingsButtonUsingLabel('Packing Method', 'Save');
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
