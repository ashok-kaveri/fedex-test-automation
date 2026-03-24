import { test, expect } from '../../src/setup/fixtures';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

// ─── Test Data ───────────────────────────────────────────────────────────────

const productData = {
  name: 'Test Msd',
  price: '5',
  sku: 'TESTSKU123',
  weight: { value: '2', unit: 'lb' as const },
  countryOfOrigin: 'IN',
  tags: ['Test Tag'],
  trackInventory: false,
  successMessage: 'Products Created',
} as const;

// ─────────────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('Products Flow', () => {
  test('Create New Simple Product and add to config', async ({ pages }) => {
    const { shopifyProductsSummary, shopifyProductPage } = pages;
    test.setTimeout(60000);

    await pages.shopifyAdmin.navigateToStore(store);

    await shopifyProductsSummary.selectShopifyMenuOption('Products');
    await shopifyProductsSummary.waitForLoadingToComplete();
    await shopifyProductPage.addNewProduct();

    await shopifyProductsSummary.setProductTitle(productData.name);
    await shopifyProductsSummary.setPrice(productData.price);
    await shopifyProductsSummary.setInventoryTracked(productData.trackInventory);
    await shopifyProductsSummary.setSKU(productData.sku);
    await shopifyProductsSummary.setWeight(productData.weight.value, productData.weight.unit);
    await shopifyProductsSummary.setCountryOfOrigin(productData.countryOfOrigin);

    await shopifyProductsSummary.addTag(productData.tags[0]);

    await shopifyProductsSummary.saveProduct();
    await expect(shopifyProductsSummary.getProductAddedMessage(productData.name)).toBeVisible();

    const productId = shopifyProductsSummary.getProductIdFromPage(shopifyProductsSummary.page);
    console.log('Product ID:', productId);

    const productdetails = await shopifyProductsSummary.getProductJson(store, productId);

    const extractedData = shopifyProductsSummary.extractProductData(productdetails);
    console.log('Extracted Data:', extractedData);
    shopifyProductsSummary.updateProductConfig(store, 'simple', extractedData);
  });
});
