import { Page, FrameLocator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrdersPageLocators } from '../locators/orders-page.locators';

// Page Object for Orders Page within FedEx App - Handles all actions related to viewing and searching orders
export class OrdersPage extends BasePage {
  private readonly appFrame: FrameLocator;
  private readonly locators: OrdersPageLocators;

  constructor(page: Page) {
    super(page);
    this.appFrame = this.getIframe('app-iframe');
    this.locators = new OrdersPageLocators(this.appFrame);
  }

  // Navigate to Orders page
  async navigate(): Promise<void> {
    await this.locators.ordersButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.ordersButton.click();
  }

  // Search for order by ID
  async searchOrder(orderID: string, maxRetries: number = 3): Promise<void> {
    await this.locators.searchButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.locators.searchButton.click();

    await this.locators.searchInput.waitFor({ state: 'visible', timeout: 5000 });
    
    const cleanOrderID = orderID.replace(/^#/, '');
    
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.locators.searchInput.clear();
        await this.locators.searchInput.fill(cleanOrderID);
        await this.locators.searchInput.press('Enter');
        
        await expect(this.locators.ordersTable).toContainText('label generated', { timeout: 8000 });
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(2000);
        }
      }
    }
    
    throw new Error(`Order ${orderID} not found in table after ${maxRetries} attempts: ${lastError?.message}`);
  }

  // Verify order appears in table with label generated status
  async verifyOrderInTable(): Promise<void> {
    await expect(this.locators.ordersTable).toContainText('label generated', { timeout: 10000 });
  }

  // Select all orders in the table
  async selectAllOrders(): Promise<void> {
    await this.locators.selectAllCell.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.selectAllCell.click();
  }

  // Open more actions menu
  async openMoreActions(): Promise<void> {
    await this.locators.moreActionsButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.moreActionsButton.click();
  }
}
