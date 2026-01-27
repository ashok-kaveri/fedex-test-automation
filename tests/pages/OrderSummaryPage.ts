import { Page, FrameLocator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { AppFrameContentLocators } from '../locators/app-frame.locators';
import { OrderSummaryPageLocators } from '../locators/order-summary-page.locators';

// Page Object for Order Summary Page - Displayed after successful label generation
export class OrderSummaryPage extends BasePage {
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;
  private readonly locators: OrderSummaryPageLocators;

  constructor(page: Page) {
    super(page);
    this.appFrame = this.getIframe('app-iframe');
    this.appContent = new AppFrameContentLocators(this.appFrame);
    this.locators = new OrderSummaryPageLocators(this.appFrame);
  }

  // Verify label was generated successfully
  async verifyLabelGenerated(): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText('label generated', { timeout: 10000 });
    await expect(this.locators.packagesSection).toBeVisible({ timeout: 5000 });
  }
}
