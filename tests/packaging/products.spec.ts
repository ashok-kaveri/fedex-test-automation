import { test, expect } from '../../src/setup/fixtures';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Products Flow', () => {
  test('1. Verify Products Page Load', async ({ pages }) => {
    test.setTimeout(60000);
    await pages.shopifyAdmin.navigateToStore(store);
    await pages.packagingSettingsPage.clickAppButton();
    await pages.packagingSettingsPage.selectAppMenu('products');
    await pages.productsPage.searchAndSelectProductByName('Test Product A');
    await pages.productsPage.addProductDimensions({
      length: 20,
      width: 15,
      height: 10,
      unit: 'ft',
    });
  });
});
