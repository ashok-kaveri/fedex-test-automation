import { Page, FrameLocator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { AppFrameContentLocators } from '../locators/app-frame.locators';
import { PickupPageLocators } from '../locators/pickup-page.locators';

// Page Object for Pickup Page within FedEx App - Handles all actions related to pickup requests and management
export class PickupPage extends BasePage {
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;
  private readonly locators: PickupPageLocators;

  constructor(page: Page) {
    super(page);
    this.appFrame = this.getIframe('app-iframe');
    this.appContent = new AppFrameContentLocators(this.appFrame);
    this.locators = new PickupPageLocators(this.appFrame);
  }

  // Request pickup for selected orders
  async requestPickup(): Promise<void> {
    await this.locators.requestPickupButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.requestPickupButton.click();

    await this.locators.confirmYesButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.locators.confirmYesButton.click();
  }

  // Verify pickup page is displayed
  async verifyPickupPage(): Promise<void> {
    await expect(this.locators.pickupHeading).toContainText('Pickups', { timeout: 10000 });
  }

  // Open pickup details for order
  async openPickupDetails(orderID: string): Promise<void> {
    const orderRow = this.locators.getOrderRow(orderID);
    await orderRow.waitFor({ state: 'visible', timeout: 10000 });
    await orderRow.click();
  }

  // Verify pickup details page
  async verifyPickupDetails(orderID: string): Promise<void> {
    await expect(this.locators.pickupHeading).toContainText('Pickup Details', { timeout: 10000 });
    await expect(this.appContent.getAppFrameMain()).toContainText(orderID, { timeout: 5000 });
  }

  // Verify pickup status
  async verifyPickupStatus(expectedStatus: string): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText(expectedStatus, { timeout: 8000 });
  }
}
