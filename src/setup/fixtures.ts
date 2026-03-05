import baseTest, { type Page } from '@playwright/test';
import { ShopifyAdminPage } from '../pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../pages/app/OrderSummaryPage/OrderSummaryPage';
import { PickupPage } from '../pages/app/PickupPage/PickupPage';
import { ReturnLabelPage } from '../pages/app/returnLabelPage/returnLabelPage';
import { PackagingSettingsPage } from '../pages/app/settings/packagingSettingsPage';
import { ProductsPage } from '../pages/app/Products/productsPage';

export type Pages = {
  sharedPage: Page;
  shopifyAdmin: ShopifyAdminPage;
  shippingPage: ShippingPage;
  manualLabelPage: GenerateLabelManuallyPage;
  orderSummaryPage: OrderSummaryPage;
  pickupPage: PickupPage;
  returnLabelPage: ReturnLabelPage;
  packagingSettingsPage: PackagingSettingsPage;
  productsPage: ProductsPage;
};

export const test = baseTest.extend<{ pages: Pages }>({
  pages: async ({ page }, use) => {
    const pages: Pages = {
      sharedPage: page,
      shopifyAdmin: new ShopifyAdminPage(page),
      shippingPage: new ShippingPage(page),
      manualLabelPage: new GenerateLabelManuallyPage(page),
      orderSummaryPage: new OrderSummaryPage(page),
      pickupPage: new PickupPage(page),
      returnLabelPage: new ReturnLabelPage(page),
      packagingSettingsPage: new PackagingSettingsPage(page),
      productsPage: new ProductsPage(page),
    };

    await use(pages);
  },
});

export const expect = test.expect;
