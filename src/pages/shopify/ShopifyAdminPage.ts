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
    await this.page.waitForLoadState('networkidle');
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

  await Promise.all([
    this.page.waitForLoadState('networkidle'),
    appLink.click()
  ]);
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
  await this.page.waitForLoadState('networkidle');
  return this.page.url();
}


}