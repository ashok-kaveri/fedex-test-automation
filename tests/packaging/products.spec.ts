// import { test } from '../../src/setup/fixtures';

// const store = process.env.STORE;

// if (!store) {
//   throw new Error('STORE environment variable is required');
// }

// test.describe.configure({ mode: 'serial' });

// test.describe('Products Flow', () => {
//   test('1. Verify Products Page Load', async ({ pages }) => {
//     test.setTimeout(60000);
//     await pages.shopifyAdmin.navigateToStore(store);
//     await pages.packagingSettingsPage.clickAppButton();
//     await pages.packagingSettingsPage.selectAppMenu('products');
//     await pages.productsPage.searchAndSelectProductByName('Test Product A');
//     await pages.productsPage.addProductDimensions({
//       length: 20,
//       width: 30,
//       height: 20,
//       unit: 'cm',
//     });

//     await pages.productsPage.setSupplementaryOption('Is Alcohol', true);
//     await pages.productsPage.selectAlcoholRecipient('LICENSEE');

//     await pages.productsPage.setSupplementaryOption('Is Dangerous Goods', true);
//     // // await pages.productsPage.configureDangerousGoods({
//     // //   option: 'LIMITED_QUANTITIES_COMMODITIES',
//     // //   accessibility: 'INACCESSIBLE',
//     // // });

//     // // await pages.productsPage.configureDangerousGoods({
//     // //   option: 'ORM_D',
//     // //   regulationType: 'ADR',
//     // // });

//     await pages.productsPage.configureDangerousGoods({
//       option: 'HAZARDOUS_MATERIALS',
//       regulatoryId: 'UN1088',
//       packagingGroup: 'I',
//       properShippingName: 'Acetal',
//       hazardClass: '3',
//       labelText: 'FLAMMABLE LIQUID',
//     });

//     await pages.productsPage.setSupplementaryOption('Is Battery', true);

//     await pages.productsPage.configureBattery({
//       material: 'LITHIUM_ION',
//       packing: 'PACKED_WITH_EQUIPMENT',
//     });

//     await pages.productsPage.setSupplementaryOption('Is Dry Ice Needed', true);
//     await pages.productsPage.setDryIceWeight(30);
//     await pages.productsPage.setSupplementaryOption('Is this product pre-packed?', true);

//     await pages.productsPage.configureShippingDetails({
//       signatureOption: 'ADULT',
//       freightClass: 'CLASS_100',
//       declaredValue: 100,
//     });

//     await pages.productsPage.configureCustomsInformation({
//       countryOfManufacture: 'IN',
//       stateOfManufacture: 'bengaluru',
//       districtOfManufacture: 'bangalore',
//       hsCode: '1211',
//       customsDescription: 'Test',
//     });
//     // await pages.sharedPage.pause();
//     await pages.productsPage.saveProduct();
//     await pages.productsPage.expectToast('Products Successfully Saved');
//   });
// });
