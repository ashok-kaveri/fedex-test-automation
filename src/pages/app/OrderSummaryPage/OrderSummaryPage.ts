import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class OrderSummaryPage extends BasePage {
  // Locators
  readonly packagesSection: Locator;
  readonly returnPackagesection: Locator;
  readonly returnPackageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.packagesSection = this.appFrame.getByLabel('Packages', { exact: true });
    this.returnPackagesection = this.appFrame.locator('[id="returnpacks"]');
    this.returnPackageButton = this.appFrame.locator('button').filter({ hasText: 'Return Packages' });
  }

  // Verify label was generated successfully
  async verifyLabelGenerated(): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText('label generated', { timeout: 10000 });
    await expect(this.packagesSection).toBeVisible({ timeout: 5000 });
  }
}
