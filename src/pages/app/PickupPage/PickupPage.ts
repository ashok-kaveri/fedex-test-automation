import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import {
  AppFrameContentLocators,
  AppFrameHelper,
} from '../../../helpers/appFrameHelper';

export class PickupPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

  // Existing Locators
  readonly pickupHeading: Locator;
  readonly requestPickupButton: Locator;
  readonly confirmYesButton: Locator;

  // Added Locators
  readonly howToButton: Locator;
  readonly helpButton: Locator;
  readonly allTab: Locator;
  readonly moreViewsButton: Locator;
  readonly pickupTable: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly paginationInfo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Existing
    this.pickupHeading = this.appFrame.getByRole('heading', {
      name: 'Pickups',
    });

    this.requestPickupButton = this.appFrame.getByRole('button', {
      name: 'Request Pick Up',
    });

    this.confirmYesButton = this.appFrame.getByRole('button', { name: 'Yes' });

    // Added
    this.howToButton = this.appFrame.getByRole('button', {
      name: 'How to',
    });

    this.helpButton = this.appFrame.getByRole('button', {
      name: 'Help',
    });

    this.allTab = this.appFrame.getByRole('tab', {
      name: 'All',
    });

    this.moreViewsButton = this.appFrame.getByRole('button', {
      name: 'More views',
    });

    this.pickupTable = this.appFrame.getByRole('table');

    this.previousButton = this.appFrame.getByRole('button', {
      name: 'Previous',
    });

    this.nextButton = this.appFrame.getByRole('button', {
      name: 'Next',
    });

    this.paginationInfo = this.appFrame.getByText(/Page \d+ of \d+/);
  }

  getOrderRow(orderID: string): Locator {
    return this.appFrame.getByRole('table').getByText(orderID);
  }

  async requestPickup(): Promise<void> {
    await this.requestPickupButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.requestPickupButton.click();

    await this.confirmYesButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.confirmYesButton.click();
  }

  async verifyPickupPage(): Promise<void> {
    await expect(this.pickupHeading).toContainText('Pickups', {
      timeout: 10000,
    });
  }

  async openPickupDetails(orderID: string): Promise<void> {
    const orderRow = this.getOrderRow(orderID);
    await orderRow.waitFor({ state: 'visible', timeout: 10000 });
    await orderRow.click();
  }

  async verifyPickupDetails(orderID: string): Promise<void> {
    await expect(this.pickupHeading).toContainText('Pickup Details', {
      timeout: 10000,
    });
    await expect(this.appContent.getAppFrameMain()).toContainText(orderID, {
      timeout: 5000,
    });
  }

  async verifyPickupStatus(expectedStatus: string): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText(
      expectedStatus,
      { timeout: 8000 },
    );
  }

  async verifyOrderStatus(
    orderID: string,
    expectedStatus: string,
  ): Promise<void> {
    const orderRow = this.getOrderRow(orderID);
    await expect(orderRow).toBeVisible({ timeout: 15000 });
  }

  async processPickupRow(orderID: any): Promise<void> {
    // await this.page.pause();
    const row = this.appFrame
      .locator('tr.Polaris-IndexTable__TableRow')
      .filter({ hasText: orderID })
      .first();

    await expect(row).toBeVisible();

    const pickupNumber = await row.locator('td').nth(1).innerText();
    const status = await row.locator('td').nth(2).innerText();
    expect(status).toContain('Success');
    const requestedTime = await row.locator('td').nth(3).innerText();
    const orders = await row.locator('td').nth(5).innerText();
    expect(orders).toContain(orderID);

    console.log('Pickup Number:', pickupNumber.trim());
    console.log('Status:', status.trim());
    console.log('Requested Time:', requestedTime.trim());
    console.log('Orders:', orders.trim());
  }
}
