import { test, expect } from '../../src/setup/fixtures';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Products Flow', () => {
  test('Validate all interactions in ShopifyProductsSummaryPage work correctly', async ({ pages }) => {
    const { shopifyProductsSummary, shopifyProductPage } = pages;
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToStore(store);

    // Click on the "Products" link to navigate to the products page
    await shopifyProductsSummary.selectShopifyMenuOption('Products');

    // Click on "Add product" button to go to the product creation page
    await shopifyProductsSummary.waitForLoadingToComplete();
    // await shopifyProductPage.addNewProduct();

    // // Use the page object from fixtures
    // const productPage = shopifyProductsSummary;

    // // Validate input fields by filling them
    // await productPage.setProductTitle('Test Product Title');
    // // await productPage.setDescription('Test Product Description');
    // await productPage.setPrice('29.99');

    // await productPage.setInventoryTracked(false);

    // // await productPage.setInventory('0', '100');
    // await productPage.setWeight('1.5', 'kg');
    // await productPage.setSKU('TESTSKU123', '1234567890123');

    // await productPage.setCountryOfOrigin('IN', '121111');

    // // Validate adding collections and tags
    // await productPage.addTag('Test Tag');

    // await productPage.saveProduct();

    await shopifyProductPage.selectProducts(['Test Product Title', 'MAdanProduct', 'Test', 'from india', 'New simple', 'Test Product A', 'Test Product B']);

    // await shopifyProductPage.searchProduct('Pant-C-');
    // await shopifyProductPage.openProductSummeryPage('Pant-C-');
    await shopifyProductPage.clickBulkEditButton();
    await expect(shopifyProductPage.skeletonLoader).toBeHidden();
    await shopifyProductPage.clickButtonByName('Columns');
    await shopifyProductPage.configureBulkEditFields({
      disableAll: true,
      enable: ['SKU', 'Weight', 'Tags', 'Physical product', 'Base price', 'Harmonized system code', 'Country of origin'],
    });
    // await shopifyProductPage.bulkUpdatePrice({
    //   price: '20',
    // });
    // await shopifyProductPage.bulkUpdateSku({
    //   productName: 'Test Product Title',
    //   sku: 'NEWSKU123',
    // });
    // await shopifyProductPage.bulkUpdateWeight({
    //   weight: '5',
    //   unit: 'kg',
    // });
    // await shopifyProductPage.bulkUpdateHsCode({
    //   hsCode: '123456',
    // });
    // await shopifyProductPage.bulkUpdateCountry({
    //   country: 'IN',
    // });
    await shopifyProductPage.bulkUpdateTags({
      tags: ['NewTag3', 'AnotherTag2234'],
    });
    // await shopifyProductPage.bulkUpdateTags({
    //   productName: 'Test Product Title',
    //   tags: ['Electronics'],
    // });

    await shopifyProductPage.clickButtonByName('Save');
    shopifyProductPage.successMessage('Products saved');
  });
});
