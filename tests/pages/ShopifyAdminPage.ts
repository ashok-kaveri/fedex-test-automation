import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ShopifyAdminPage extends BasePage {
  private readonly searchButton: Locator;
  private readonly searchContainer: Locator;
  private readonly ordersButton: Locator;
  private readonly searchInput: Locator;
  private readonly searchResults: Locator;

  constructor(page: Page) {
    super(page);
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.searchContainer = page.locator('#search-container');
    this.ordersButton = this.searchContainer.getByRole('button', { name: 'Orders' });
    this.searchInput = page.getByRole('combobox', { name: 'Search' });
    this.searchResults = page.locator('ul#search-results');
  }

  /**
   * Navigate to Shopify admin store
   */
  async navigateToStore(storeName: string): Promise<void> {
    await this.goto(`https://admin.shopify.com/store/${storeName}`);
    await this.waitForVisible(this.searchButton);
  }

  /**
   * Search and open order by ID with retry logic
   */
  async searchAndOpenOrder(orderID: string, maxRetries: number = 3): Promise<void> {
    await this.clickElement(this.searchButton);
    await this.clickElement(this.ordersButton);
    await this.fillInput(this.searchInput, orderID);
    
    // Wait for search results with retry logic
    const orderLink = this.searchResults.locator(
      `a[role="option"][href*="/orders/"]`,
      { hasText: orderID }
    );

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await orderLink.waitFor({ state: 'visible', timeout: 8000 });
        await this.clickElement(orderLink);
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Clear and refill search
          await this.searchInput.clear();
          await this.page.waitForTimeout(1000);
          await this.fillInput(this.searchInput, orderID);
          await this.page.waitForTimeout(2000);
        }
      }
    }
    
    throw new Error(`Order ${orderID} not found after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Open more actions menu
   */
  async openMoreActions(): Promise<void> {
    const moreActionsButton = this.page.getByRole('button', { name: 'More actions' }).first();
    await this.clickElement(moreActionsButton);
  }

  /**
   * Click on Generate Label link to open manual label generation page
   */
  async openManualLabelPage(): Promise<void> {
    const generateLabelLink = this.page.getByRole('link', { name: 'Generate Label', exact: true });
    await this.clickElement(generateLabelLink);
  }
}
