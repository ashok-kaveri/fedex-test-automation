import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../../helpers/appFrameHelper';

// Page Object for Pickup Page within FedEx App - Handles all pickup-related actions
export class PickupPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

  // Locators
  readonly pickupHeading: Locator;
  readonly requestPickupButton: Locator;
  readonly confirmYesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize locators
    this.pickupHeading = this.appFrame.getByRole('heading');
    this.requestPickupButton = this.appFrame.getByRole('button', { name: 'Request Pick Up' });
    this.confirmYesButton = this.appFrame.getByRole('button', { name: 'Yes' });
  }

  // Helper method for dynamic locators
  getOrderRow(orderID: string): Locator {
    return this.appFrame.getByRole('table').getByText(orderID);
  }

  // Request pickup for selected orders
  async requestPickup(): Promise<void> {
    await this.requestPickupButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.requestPickupButton.click();

    await this.confirmYesButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.confirmYesButton.click();
  }

  // Verify pickup page is displayed
  async verifyPickupPage(): Promise<void> {
    await expect(this.pickupHeading).toContainText('Pickups', { timeout: 10000 });
  }

  // Open pickup details for order
  async openPickupDetails(orderID: string): Promise<void> {
    const orderRow = this.getOrderRow(orderID);
    await orderRow.waitFor({ state: 'visible', timeout: 10000 });
    await orderRow.click();
  }

  // Verify pickup details page
  async verifyPickupDetails(orderID: string): Promise<void> {
    await expect(this.pickupHeading).toContainText('Pickup Details', { timeout: 10000 });
    await expect(this.appContent.getAppFrameMain()).toContainText(orderID, { timeout: 5000 });
  }

  // Verify pickup status
  async verifyPickupStatus(expectedStatus: string): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText(expectedStatus, { timeout: 8000 });
  }
}
