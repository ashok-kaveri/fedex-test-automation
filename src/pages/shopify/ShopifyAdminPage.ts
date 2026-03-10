import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
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



  }

  // Helper method for dynamic locators
  getOrderLink(orderID: string): Locator {
    return this.searchResults.locator(`a[role="option"][href*="/orders/"]`, { hasText: orderID });
  }

  // Navigate to Shopify admin store
  async navigateToStore(storeName: string): Promise<void> {
    await this.page.goto(`https://admin.shopify.com/store/${storeName}`);
    await this.searchButton.waitFor({ state: 'visible' });
  }

  // Search and open order by ID with retry logic
  async searchAndOpenOrder(orderID: string, maxRetries: number = 4): Promise<void> {
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
    await this.moreActionsButton.click();
  }

  // Click on Generate Label link to open manual label generation page
  async clickGenerateLabelLink(): Promise<void> {
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


  // fulfilling order from Shopify Order Summary page
  async confirmOrderFulfillment(): Promise<void> {
    await this.markAsFulfilledButton.click();
    await this.markAsFulfilledButton.click();
    await expect(this.fulfillmentStatusBadge).toBeVisible({ timeout: 20000 });
    await expect(this.fulfillmentStatusBadge).toContainText('Fulfilled');
  }

  //generic method to navigate to order and click on generate label manually in shopify admin
  async navigateToOrderInShopifyAndClickGenerateLabel(orderID: string): Promise<void> {
    await this.navigateToStore(process.env.STORE!);
    await this.searchAndOpenOrder(orderID, 5);
    await this.openMoreActions();
    await this.clickGenerateLabelLink();
  }

  async fulfillOrderInShopify(orderID: string) {
    await this.navigateToStore(process.env.STORE!);
    await this.searchAndOpenOrder(orderID, 5);
    await this.confirmOrderFulfillment();
    await this.openMoreActions();
    await this.clickOnGenerateReturnLabel();
    
  }


} 

