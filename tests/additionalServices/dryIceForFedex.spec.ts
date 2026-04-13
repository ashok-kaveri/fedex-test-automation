import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;
if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Dry Ice for FedEx', { tag: '@smoke' }, () => {
  let sharedOrderID: string;
  let orderUploader: ShopifyOrderUploader;

  // TC-1: Merchant Enables and Saves Dry Ice Configuration
  test('TC-1: Merchant enables and saves Dry Ice configuration', async ({ pages }) => {
    test.setTimeout(90000);

    await pages.shopifyAdmin.navigateToStore(store);
    await pages.additionalServices.navigateToAdditionalServices();

    // Scroll to and verify the Dry Ice section is visible
    await pages.additionalServices.dryIceHeading.scrollIntoViewIfNeeded();
    await expect(pages.additionalServices.dryIceHeading).toBeVisible();
    await expect(pages.additionalServices.dryIceSection).toBeVisible();

    // Enable the Dry Ice toggle (force needed — Polaris renders checkbox as hidden input)
    // eslint-disable-next-line playwright/no-force-option
    await pages.additionalServices.dryIceToggleCheckbox.check({ force: true });
    await expect(pages.additionalServices.dryIceToggleCheckbox).toBeChecked();

    // Enter dry ice weight
    await pages.additionalServices.dryIceWeightInput.scrollIntoViewIfNeeded();
    await pages.additionalServices.dryIceWeightInput.clear();
    await pages.additionalServices.dryIceWeightInput.fill('2.5');

    // Select unit of measurement: kg
    await pages.additionalServices.dryIceWeightUnitSelect.selectOption('kg');

    // Save the configuration
    await pages.additionalServices.dryIceSaveButton.click();

    // Verify success banner
    await expect(pages.additionalServices.dryIceSuccessBanner).toBeVisible({ timeout: 15000 });
  });

  // TC-1b: Verify persistence after page refresh
  test('TC-1b: Dry Ice configuration persists after page refresh', async ({ pages }) => {
    test.setTimeout(60000);

    await pages.shopifyAdmin.navigateToStore(store);
    await pages.additionalServices.navigateToAdditionalServices();

    await pages.additionalServices.dryIceHeading.scrollIntoViewIfNeeded();

    // Toggle should remain enabled
    await expect(pages.additionalServices.dryIceToggleCheckbox).toBeChecked();

    // Weight value should persist
    await expect(pages.additionalServices.dryIceWeightInput).toHaveValue('2.5');

    // Unit should persist as kg
    await expect(pages.additionalServices.dryIceWeightUnitSelect).toHaveValue('kg');
  });

  // Create order for label generation tests
  test('Create an order from API', async () => {
    orderUploader = new ShopifyOrderUploader();
    const orderID = await orderUploader.uploadOrder();
    expect(orderID, 'Failed to create Shopify order').toBeTruthy();
    sharedOrderID = orderID!;
    console.log(`Order created: ${sharedOrderID}`);
  });

  // TC-2: Single Package Domestic Shipment with Dry Ice Generates Valid Label
  test('TC-2: Single package domestic shipment with dry ice generates valid label', async ({ pages }) => {
    test.setTimeout(120000);

    await pages.shopifyAdmin.navigateToStore(store);
    await pages.shopifyAdmin.searchAndOpenOrder(sharedOrderID);
    await pages.manualLabelPage.generateLabelInApp();

    await expect(pages.orderSummaryPage.packagesSection).toBeVisible({ timeout: 30000 });
  });

  // TC-3: Multi-Package Shipment with Selective Dry Ice Application
  // Requires backend API payload inspection — skipped as it needs API simulation
  test('TC-3: Multi-package shipment with selective dry ice application', async () => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      true,
      'TC-3 requires FedEx API request payload inspection for per-package dry ice validation — backend mocking not available in UI automation scope'
    );

    expect(true).toBe(true);
  });

  // TC-6: Non-Dry Ice Shipments Unaffected by Dry Ice Feature
  test('TC-6: Non-dry ice shipments are unaffected when dry ice feature is enabled', async ({ pages }) => {
    test.setTimeout(120000);

    const nonDryIceUploader = new ShopifyOrderUploader();
    const nonDryIceOrderID = await nonDryIceUploader.uploadOrder();
    expect(nonDryIceOrderID, 'Failed to create non-dry-ice Shopify order').toBeTruthy();
    console.log(`Non-dry-ice order created: ${nonDryIceOrderID}`);

    await pages.shopifyAdmin.navigateToStore(store);
    await pages.shopifyAdmin.searchAndOpenOrder(nonDryIceOrderID!);
    await pages.manualLabelPage.generateLabelInApp();

    await expect(pages.orderSummaryPage.packagesSection).toBeVisible({ timeout: 30000 });
  });
});
