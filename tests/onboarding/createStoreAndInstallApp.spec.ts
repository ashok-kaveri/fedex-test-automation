import { test, expect } from '../../src/setup/fixtures';
import { StoreNameGenerator } from '../../src/helpers/storeNameGenerator';
import { ShopifyCreateStoreFormPage } from '../../src/pages/shopify/ShopifyCreateStoreFormPage';
import { ShopifyStoreSelectionPage } from '../../src/pages/shopify/ShopifyStoreSelectionPage';
import { ShopifyStoreInstallationPage } from '../../src/pages/shopify/ShopifyStoreInstallationPage';

test.describe.configure({ mode: 'serial' });

const appName = process.env.APP_NAME!;
const partnersUrl = process.env.PARTNERS_URL!;

test.describe('Shopify Store Creation and App Installation', () => {
  let storeName: string;

  test.beforeAll(async ({ pages }) => {
    storeName = StoreNameGenerator.generate();
    console.log('Generated Store Name:', storeName);

    await pages.sharedPage.goto(partnersUrl);

    await pages.shopifyDevDashboardStorePage.navigateToDevStores();

    const createStorePage = await pages.shopifyDevDashboardStorePage.openCreateStoreForm();

    const createStoreForm = new ShopifyCreateStoreFormPage(createStorePage);

    await createStoreForm.createStore({
      storeName,
      plan: 'Advanced',
    });

    console.log(`Store "${storeName}" created successfully`);
  });

  test.skip('Install app in created store', async ({ pages }) => {
    test.setTimeout(500000);

    await pages.sharedPage.goto(partnersUrl);
    const Installpage = await pages.shopifyDevDashboardAppPage.installAppFromDevDashboard(appName);
    const selectionPage = new ShopifyStoreSelectionPage(Installpage);

    await selectionPage.selectStoreAndProceed(storeName);
    // Create installation page using the SAME tab
    const installationPage = new ShopifyStoreInstallationPage(Installpage);
    await installationPage.installAppToStore();
    const installationVerificationText = `Thank You for choosing ${appName} for FedEx`;
    await expect(installationPage.getinstallationVerificationMessage(installationVerificationText)).toBeVisible({ timeout: 40000 });
    console.log(`App "${appName}" installed successfully in "${storeName}"`);
  });
});
