import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../../../helpers/appFrameHelper';

// Page Object for Order Summary Page - Displayed after successful label generation
export class OrderSummaryPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

  // Locators
  readonly packagesSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize locators
    this.packagesSection = this.appFrame.getByLabel('Packages', { exact: true });
  }

  // Verify label was generated successfully
  async verifyLabelGenerated(): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText('label generated', { timeout: 10000 });
    await expect(this.packagesSection).toBeVisible({ timeout: 5000 });
  }
}
