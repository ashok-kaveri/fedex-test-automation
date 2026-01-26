import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ShopifyAdminLocators } from '../locators/shopify-admin.locators';

export class ShopifyAdminPage extends BasePage {
  private readonly locators: ShopifyAdminLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new ShopifyAdminLocators(page);
  }

  // Navigate to Shopify admin store
  async navigateToStore(storeName: string): Promise<void> {
    await this.goto(`https://admin.shopify.com/store/${storeName}`);
    await this.waitForVisible(this.locators.searchButton);
  }

  // Search and open order by ID with retry logic
  async searchAndOpenOrder(orderID: string, maxRetries: number = 3): Promise<void> {
    await this.clickElement(this.locators.searchButton);
    await this.clickElement(this.locators.ordersButton);
    await this.fillInput(this.locators.searchInput, orderID);
    
    // Wait for search results with retry logic
    const orderLink = this.locators.getOrderLink(orderID);

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
          await this.locators.searchInput.clear();
          await this.page.waitForTimeout(1000);
          await this.fillInput(this.locators.searchInput, orderID);
          await this.page.waitForTimeout(2000);
        }
      }
    }
    
    throw new Error(`Order ${orderID} not found after ${maxRetries} attempts: ${lastError?.message}`);
  }

  // Open more actions menu
  async openMoreActions(): Promise<void> {
    await this.clickElement(this.locators.moreActionsButton);
  }

  // Click on Generate Label link to open manual label generation page
  async openManualLabelPage(): Promise<void> {
    await this.clickElement(this.locators.generateLabelLink);
  }
}