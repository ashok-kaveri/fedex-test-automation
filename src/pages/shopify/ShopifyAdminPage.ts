import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyAdminPage extends BasePage {
  // Locators
  readonly searchButton: Locator;
  readonly searchContainer: Locator;
  readonly ordersButton: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly moreActionsButton: Locator;
  readonly generateLabelLink: Locator;
  readonly autoGenerateLabel: Locator;
  readonly markAsFulfilledButton: Locator;
  readonly fulfillmentStatusBadge: Locator;
  readonly generateReturnLabelLink: Locator;
  readonly appsButton: Locator;

  // ── Orders-list bulk action locators (orders LIST page, not individual order) ──
  readonly ordersListHeaderCheckbox: Locator;
  readonly bulkActionsMoreButton: Locator;
  readonly bulkAutoGenerateLabelsButton: Locator;
  readonly ordersListNextPageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.searchContainer = page.locator('#search-container');
    this.ordersButton = this.searchContainer.getByRole('button', { name: 'Orders' });
    this.searchInput = page.getByRole('combobox', { name: 'Search' });
    this.searchResults = page.locator('ul#search-results');
    this.moreActionsButton = page.getByRole('button', { name: 'More actions' }).first();
    this.generateLabelLink = page.getByRole('link', { name: 'Generate Label', exact: true });
    this.autoGenerateLabel = page.getByRole('link', { name: 'Auto-Generate Label', exact: true });
    this.markAsFulfilledButton = page.getByRole('button', { name: 'Mark as fulfilled' });
    // this.fulfillmentStatusBadge = page.locator('s-internal-badge:nth-child(4) > .badge');
    this.fulfillmentStatusBadge = page.getByText('CompletePaidCompleteFulfilledArchived');
    this.generateReturnLabelLink = page.getByRole('link', { name: 'Generate Return Label', exact: true });
    this.appsButton = page.getByRole('button', { name: 'Apps' });

    // ── Orders list bulk actions ──────────────────────────────────────────────
    // "Select all N on page" — target the visible <label> inside the Selection header.
    // The actual <input type="checkbox"> has opacity:0 so Playwright cannot click it.
    // Clicking the label fires the React onChange event and toggles the selection.
    this.ordersListHeaderCheckbox = page
      .getByRole('columnheader', { name: 'Selection' })
      .locator('label');
    // "Actions" overflow button that appears in the bulk actions bar after selecting orders.
    // Scoped to the sticky bulk actions container to avoid matching the page-header "More actions" button.
    this.bulkActionsMoreButton = page
      .locator('[class*="StickyBulkActions"]')
      .getByRole('button', { name: 'Actions' });
    // "Auto-Generate Labels" option under Actions → Apps
    this.bulkAutoGenerateLabelsButton = page.getByRole('link', { name: 'Auto-Generate Labels' });
    // Pagination Next button on the orders list
    this.ordersListNextPageButton = page.getByRole('button', { name: 'Next' }).last();
  }

  // Helper method for dynamic locators
  getOrderLink(orderID: string): Locator {
    return this.searchResults.locator(`a[role="option"][href*="/orders/"]`, { hasText: orderID });
  }
  
  getAppLink(appName: string): Locator {  
    return this. page.getByRole('option', { name: appName}).nth(0);

  }

  // Navigate to Shopify admin store
  async navigateToStore(storeName: string): Promise<void> {
    await this.page.goto(`https://admin.shopify.com/store/${storeName}`);
    await this.page.waitForLoadState('domcontentloaded');
    // networkidle removed — Shopify admin has constant background XHR that never settles.
    // searchButton visibility is a reliable signal that the page is ready.
    await this.searchButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  // Search and open order by ID with retry logic
  async searchAndOpenOrder(orderID: string, maxRetries: number = 4): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.searchButton.click();
    await this.ordersButton.click();
    await this.searchInput.fill(orderID);

    // Wait for search results with retry logic
    const orderLink = this.getOrderLink(orderID);

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await orderLink.waitFor({ state: 'visible', timeout: 1000 });
        await orderLink.click();
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          // Clear and refill search
          await this.searchInput.clear();
          await this.page.waitForTimeout(1000);
          await this.searchInput.fill(orderID);
          await this.page.waitForTimeout(2000);
        }
      }
    }

    throw new Error(`Order ${orderID} not found after ${maxRetries} attempts: ${lastError?.message}`);
  }

  //Return the Order fuflilment status
  async isOrderFulfilled(): Promise<string> {
  const badge = this.page
    .locator('s-internal-badge')
    .filter({ hasText: /(Fulfilled|Unfulfilled|Partially fulfilled)/i })
    .first();

  return (await badge.innerText()).trim();
}

  // Open more actions menu
  async openMoreActions(): Promise<void> {
    await this.moreActionsButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.moreActionsButton.click();
  }

  // Click on Generate Label link to open manual label generation page
  async clickGenerateLabelLink(): Promise<void> {
    await this.generateLabelLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.generateLabelLink.click();
  }

  //Click on Auto-label generation

  async clickOnAutoLabelGeneration(): Promise<void> {
    await this.autoGenerateLabel.click();
  }

  //Click on Generate Return Label
  async clickOnGenerateReturnLabel(): Promise<void> {
    await this.generateReturnLabelLink.click();
  }
// Click Apps button
  async openAppsSection(): Promise<void> {
  await this.appsButton.click();
}
//Search for the app
async searchApp(appName: string): Promise<void> {
  await this.searchInput.fill(appName);
  await this.page.keyboard.press('Enter');
}
//Click the app from search results

async clickAppFromResults(appName: string): Promise<void> {
  const appLink = this.getAppLink(appName);

  await appLink.waitFor({ state: 'visible', timeout: 20000 });
  await appLink.click();
  // networkidle removed — Shopify admin has constant background XHR that never settles.
  await this.page.waitForLoadState('domcontentloaded');
}

  // fulfilling order from Shopify Order Summary page
  async confirmOrderFulfillment(): Promise<string> {
    await this.markAsFulfilledButton.click();
    await this.markAsFulfilledButton.click();
    await this.fulfillmentStatusBadge.waitFor({ state: 'visible', timeout: 20000 });
    return await this.fulfillmentStatusBadge.innerText();
  }

  //generic method to navigate to order and click on generate label manually in shopify admin
  async navigateToOrderInShopifyAndClickGenerateLabel(orderID: string): Promise<void> {
    await this.navigateToStore(process.env.STORE!);
    await this.searchAndOpenOrder(orderID, 5);
    await this.openMoreActions();
    await this.clickGenerateLabelLink();
  }

async clickGenerateReturnLabelLink(): Promise<void> {
    await this.generateReturnLabelLink.click();
  }
//Method to generate return label from Shopify Order summary page for a fulfilled order
  async navigateToOrderInShopifyAndCheckStatus(orderID: string): Promise<void> {
  await this.navigateToStore(process.env.STORE!);
  await this.searchAndOpenOrder(orderID, 5);

  const status = await this.isOrderFulfilled();
  console.log('Status:', status);

  if (!status.toLowerCase().includes('fulfilled')) {
    throw new Error(`Order not fulfilled → ${status}`);
  }
  await this.openMoreActions();
  await this.clickGenerateReturnLabelLink();
  }

  async fulfillOrderInShopify(orderID: string): Promise<string> {
    await this.navigateToStore(process.env.STORE!);
    await this.searchAndOpenOrder(orderID, 5);
    const status = await this.confirmOrderFulfillment();
    await this.openMoreActions();
    await this.clickOnGenerateReturnLabel();
    return status;
  }

  
  async navigateToApp(appName: string): Promise<string> {
  console.log(`Navigating to app "${appName}" in Shopify Admin...`);
  await this.openAppsSection();
  await this.searchApp(appName);
  await this.clickAppFromResults(appName);
  // networkidle removed — clickAppFromResults already waits for domcontentloaded.
  return this.page.url();
}

  // ── Orders-list bulk action methods ────────────────────────────────────────

  /** Navigate to the Shopify admin orders list page */
  async navigateToOrdersList(storeName: string): Promise<void> {
    await this.page.goto(`https://admin.shopify.com/store/${storeName}/orders`);
    await this.page.waitForURL(`**/${storeName}/orders**`);
    // Shopify admin has constant background polling so networkidle never settles.
    // Wait for the select-all checkbox — it only appears when the orders table is fully rendered.
    await this.ordersListHeaderCheckbox.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Select all orders on the current orders-list page (50 per page).
   * Clicks the header checkbox then waits for the bulk-actions bar to appear.
   */
  async selectAllOrdersOnCurrentPage(): Promise<void> {
    await this.ordersListHeaderCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.ordersListHeaderCheckbox.click();
    // Wait for the "Actions" overflow button — it only appears in the bulk actions bar
    // once at least one order is selected. This is more reliable than polling for
    // "N selected" text (which lives inside the shadow DOM and can flicker).
    await this.bulkActionsMoreButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[ShopifyAdmin] Orders selected — bulk actions bar is ready');
  }

  /**
   * Click the "..." overflow button in the bulk actions bar.
   * This is the 3-dot menu that appears after selecting orders in the list.
   */
  async clickBulkActionsMore(): Promise<void> {
    await this.bulkActionsMoreButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.bulkActionsMoreButton.click();
  }

  /**
   * Click "Auto-Generate Labels" from the "..." bulk actions menu.
   * This navigates to the FedEx app with the selected order IDs.
   */
  async clickBulkAutoGenerateLabels(): Promise<void> {
    await this.bulkAutoGenerateLabelsButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.bulkAutoGenerateLabelsButton.click();
    // After clicking, Shopify navigates to the FedEx app.
    // waitForLoadState('networkidle') never resolves on Shopify admin due to constant background XHR,
    // so we wait for the URL to leave the orders page instead.
    await this.page.waitForURL(url => !url.toString().includes('/orders'), { timeout: 30_000 });
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Click the "Next" pagination button on the orders list */
  async clickNextPageInOrdersList(): Promise<void> {
    await this.ordersListNextPageButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.ordersListNextPageButton.click();
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the select-all checkbox to confirm the next page's table is rendered.
    await this.ordersListHeaderCheckbox.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Full bulk auto-label flow for one page of orders:
   * select all → click "..." → click Auto-Generate Labels
   */
  async bulkAutoGenerateLabelsForCurrentPage(): Promise<void> {
    await this.selectAllOrdersOnCurrentPage();
    await this.clickBulkActionsMore();
    await this.clickBulkAutoGenerateLabels();
  }
}
