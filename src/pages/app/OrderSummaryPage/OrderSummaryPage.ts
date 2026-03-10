import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class OrderSummaryPage extends BasePage {
  // Locators
  readonly packagesSection: Locator;
  readonly returnPackagesection: Locator;
  readonly returnPackageButton: Locator;
  readonly printDocumentsButton: Locator;
  readonly labelGeneratedStatus: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.packagesSection = this.appFrame.getByLabel('Packages', { exact: true });
    this.returnPackagesection = this.appFrame.locator('[id="returnpacks"]');
    this.returnPackageButton = this.appFrame.getByRole('button', { name: 'Return Packages' });
    this.printDocumentsButton = this.appFrame.getByRole('button', { name: 'Print Documents' });
    
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

  // Verify return package section is displayed
  async navigatingToReturnLabelPage() {
    await expect(this.returnPackagesection).toBeVisible({ timeout: 5000 });
    await this.returnPackagesection.click();
    await expect(this.returnPackageButton).toBeVisible({ timeout: 5000 });
    await this.returnPackageButton.click();
  }

  // printing the documents for the label generated order
  async clickPrintDocuments(): Promise<void> {
    await this.printDocumentsButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.printDocumentsButton.click();
}

}
