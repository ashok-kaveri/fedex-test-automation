import baseTest from '@playwright/test';
import { type Page } from '@playwright/test';
import type { Browser } from '@playwright/test';
import * as fs from 'fs';
import { ShopifyAdminPage } from '../pages/shopify/ShopifyAdminPage';
import { ShippingPage } from '../pages/app/ShippingPage/ShippingPage';
import { GenerateLabelManuallyPage } from '../pages/app/ManualLabelPage/ManualLabelPage';
import { OrderSummaryPage } from '../pages/app/OrderSummaryPage/OrderSummaryPage';
import { PickupPage } from '../pages/app/PickupPage/PickupPage';
import { ReturnLabelPage } from '../pages/app/returnLabelPage/returnLabelPage';
import { PackagingSettingsPage } from '../pages/app/settings/packagingSettingsPage';
import { ProductsPage } from '../pages/app/Products/productsPage';
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
  productsPage: ProductsPage;
  sideDockPage: SideDockPage;
};
export const test = baseTest.extend<{ pages: Pages }>({
  pages: [
    async ({ browser }: { browser: Browser }, use: (r: Pages) => Promise<void>) => {
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
        productsPage: new ProductsPage(page),
        sideDockPage: new SideDockPage(page),
      };
      await use(pages);
      await context.close();
    },
    { scope: 'worker' },
  ] as unknown as any,
});
export const expect = test.expect;
