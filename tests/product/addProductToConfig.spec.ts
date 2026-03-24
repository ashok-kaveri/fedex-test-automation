import { test, expect } from '../../src/setup/fixtures';
import { ProductInput } from '../../src/config/product.types';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

// Products data
const PRODUCT_INPUTS: ProductInput[] = [
  { name: 'Test Produce Product', type: 'simple' },
  { name: 'Test Msd', type: 'simple' },
  { name: 'Variable product 2', type: 'variable' },
];

// ─────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.describe('Products Flow', () => {
  test('Add Existing Products to Config', async ({ pages }) => {
    const { shopifyProductsSummary, shopifyProductPage } = pages;
    test.setTimeout(60000);

    await pages.shopifyAdmin.navigateToStore(store);

    await shopifyProductsSummary.selectShopifyMenuOption('Products');
    await shopifyProductsSummary.waitForLoadingToComplete();
    for (const { name, type } of PRODUCT_INPUTS) {
      await shopifyProductPage.searchProduct(name);
      await shopifyProductPage.openProductSummeryPage(name);
      await shopifyProductsSummary.page.waitForURL(/\/products\/\d+/);
      const productId = shopifyProductsSummary.getProductIdFromPage(shopifyProductsSummary.page);
      const productdetails = await shopifyProductsSummary.getProductJson(store, productId);
      const extractedData = shopifyProductsSummary.extractProductData(productdetails);
      expect(extractedData.product_id).toBe(productId);
      expect(extractedData.variant_id).toBeTruthy();
      shopifyProductsSummary.updateProductConfig(store, type, extractedData);
      await shopifyProductsSummary.selectShopifyMenuOption('Products');
      await shopifyProductsSummary.waitForLoadingToComplete();
    }
  });
});
