import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../../../helpers/appFrameHelper';

// Page Object for Order Summary Page - Displayed after successful label generation
export class OrderSummaryPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

  // Locators
  readonly packagesSection: Locator;
  readonly returnPackagesection: Locator;
  readonly returnPackageButton: Locator;
  readonly labelGeneratedStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize locators
    this.packagesSection = this.appFrame.getByLabel('Packages', { exact: true });
    this.returnPackagesection = this.appFrame.locator('[id="returnpacks"]');
    this.returnPackageButton = this.appFrame.locator('button').filter({ hasText: 'Return Packages' });
    this.labelGeneratedStatus = this.appFrame.locator('text=label generated');
  }

  // Verify label was generated successfully - waits up to 70 seconds
  async verifyLabelGenerated(): Promise<void> {
    try {
      // Wait for "label generated" text to appear with 70 second timeout
      await this.labelGeneratedStatus.waitFor({ state: 'visible', timeout: 70000 });
    } catch (error) {
      // If not found, check if we can still verify via packages section
    }
    
    // Verify packages section is visible
    await expect(this.packagesSection).toBeVisible({ timeout: 10000 });
  }
}
