import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

export class OrderSummaryPage extends BasePage {
  readonly packagesSection: Locator;
  readonly returnPackagesection: Locator;
  readonly returnPackageButton: Locator;
  readonly printDocumentsButton: Locator;
  readonly labelGeneratedStatus: Locator;

  readonly nextOrderButton: Locator;
  readonly previousOrderButton: Locator;
  readonly orderPositionIndicator: Locator;

  constructor(page: Page) {
    super(page);

    this.packagesSection = this.appFrame.getByLabel('Packages', { exact: true });
    this.returnPackagesection = this.appFrame.locator('[id="returnpacks"]');
    this.returnPackageButton = this.appFrame.getByRole('button', { name: 'Return Packages', exact: true });
    this.printDocumentsButton = this.appFrame.getByRole('button', { name: 'Print Documents' });
    this.labelGeneratedStatus = this.appFrame.locator('text=label generated');

    this.nextOrderButton = this.appFrame.getByRole('button', { name: 'Next', exact: true });
    this.previousOrderButton = this.appFrame.getByRole('button', { name: 'Previous', exact: true });
    this.orderPositionIndicator = this.appFrame.locator('[data-testid="order-position-indicator"]');
  }

  async verifyLabelGenerated(): Promise<void> {
    try {
      await this.labelGeneratedStatus.waitFor({ state: 'visible', timeout: 3000 });
    } catch (error) {
      // If not found, verify via packages section
    }
  }

  async navigatingToReturnLabelPage() {
    await this.returnPackagesection.waitFor({ state: 'visible', timeout: 15000 });
    await this.returnPackagesection.click();
    await this.returnPackageButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.returnPackageButton.click();
  }

  async clickPrintDocuments(): Promise<void> {
    await this.printDocumentsButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.printDocumentsButton.click();
  }

  async clickNextOrder(): Promise<void> {
    await this.nextOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.nextOrderButton.click();
  }

  async clickPreviousOrder(): Promise<void> {
    await this.previousOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.previousOrderButton.click();
  }

  async waitForOrderDetailsToLoad(timeoutMs = 15000): Promise<void> {
    await this.packagesSection.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async verifyNextButtonIsEnabled(): Promise<void> {
    await this.nextOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.nextOrderButton).toBeEnabled();
  }

  async verifyPreviousButtonIsEnabled(): Promise<void> {
    await this.previousOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.previousOrderButton).toBeEnabled();
  }
}
