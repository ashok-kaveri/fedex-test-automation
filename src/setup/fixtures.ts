import { test as baseTest, type Page } from '@playwright/test';
import * as fs from 'fs';
import { ShopifyAdminPage } from '../pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../pages/app/OrderSummaryPage/OrderSummaryPage';
import { PickupPage } from '../pages/app/PickupPage/PickupPage';
import { ReturnLabelPage } from '../pages/app/returnLabelPage/returnLabelPage';
import { PackagingSettingsPage } from '../pages/app/settings/packagingSettingsPage';
import { ProductsPage_M } from '../pages/app/Products/productsPage_M';
import { ShopifyProductsSummaryPage } from '../pages/shopify/ShopifyProductsSummeryPage';
import { ShopifyProductPage } from '../pages/shopify/ShopifyProductPage';
import { ProductPage } from '../pages/app/productsPage/productsPage';
import { ProductSummaryPage } from '../pages/app/productsPage/productSummaryPage';
import { SideDockPage } from '../pages/app/ManualLabelPage/SideDockConfig';

export type Pages = {
  sharedPage: Page;
  shopifyAdmin: ShopifyAdminPage;
  shippingPage: ShippingPage;
  manualLabelPage: GenerateLabelManuallyPage;
  orderSummaryPage: OrderSummaryPage;
  pickupPage: PickupPage;
  returnLabelPage: ReturnLabelPage;
  packagingSettingsPage: PackagingSettingsPage;
  productsPage: ProductsPage_M;
  shopifyProductsSummary: ShopifyProductsSummaryPage;
  shopifyProductPage: ShopifyProductPage;
  productPage: ProductPage;
  productSummaryPage: ProductSummaryPage;
  sideDockPage: SideDockPage;
};

export const test = baseTest.extend<object, { pages: Pages }>({
  pages: [
    async ({ browser }, use) => {
      const storagePath = './auth.json';
      if (!fs.existsSync(storagePath)) {
        throw new Error('auth.json not found. Run the login --npx playwright test --project="setup" --headed ');
      }
      const context = await browser.newContext({ storageState: storagePath });
      const page = await context.newPage();
      const pages: Pages = {
        sharedPage: page,
        shopifyAdmin: new ShopifyAdminPage(page),
        shippingPage: new ShippingPage(page),
        manualLabelPage: new GenerateLabelManuallyPage(page),
        orderSummaryPage: new OrderSummaryPage(page),
        pickupPage: new PickupPage(page),
        returnLabelPage: new ReturnLabelPage(page),
        packagingSettingsPage: new PackagingSettingsPage(page),
        productsPage: new ProductsPage_M(page),
        shopifyProductsSummary: new ShopifyProductsSummaryPage(page),
        shopifyProductPage: new ShopifyProductPage(page),
        productPage: new ProductPage(page),
        productSummaryPage: new ProductSummaryPage(page),
        sideDockPage: new SideDockPage(page),
      };
      await use(pages);
      await context.close();
    },
    { scope: 'worker' },
  ],
});

export const expect = test.expect;
