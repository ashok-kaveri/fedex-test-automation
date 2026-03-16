import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class ReturnLabelPage extends BasePage {
  // Locators
  readonly returnLabelPageTitle: Locator;
  readonly returnQuantityInput: Locator;
  readonly refreshratesButton: Locator;
  readonly retryButton: Locator;
  readonly radioButtons: Locator;
  readonly shippingRatesSelection: Locator;
  readonly generateReturnLabelButton: Locator;
  readonly successBadge: Locator;
  readonly downloadLink: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.returnLabelPageTitle = this.appFrame.locator(`div.Polaris-Page-Header__TitleWrapper > h1`);
    this.returnQuantityInput = this.appFrame.locator('input[name="[object Object].returnQuantity"]');
    this.refreshratesButton = this.appFrame.getByRole('button', { name: 'Refresh Rates' });
    this.retryButton = this.appFrame.getByRole('button', { name: 'Retry' });
    this.radioButtons = this.appFrame.locator('input[type="radio"][name]');
    // this.shippingRatesSelection = this.appFrame.locator('input[type="radio"]'); // make sure while using this locotor use [0]
    this.shippingRatesSelection = this.appFrame.getByRole('radio', { name: /FedEx/i });
    this.generateReturnLabelButton = this.appFrame.getByRole('button', { name: 'Generate Return Label' });
    this.successBadge = this.appFrame.getByText('SUCCESS').first();
    this.downloadLink = this.appFrame.getByText('Download Label').first();
  }

  // Verify return label page title
  async validateReturnLabelTitle() {
    // await this.page.goto(`https://admin.shopify.com/store/${process.env.STORE}/apps/testing-553/api/v1/returnLabels`);
    await this.page.waitForLoadState('load');
    await this.returnLabelPageTitle.waitFor({ state: 'visible', timeout: 5000 });
  }

  async waitForShippingRatesWithRetry(maxRetries: number = 5): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.radioButtons.first().waitFor({ state: 'visible', timeout: 10000 });
        return; // Success: Exit the method
      } catch (error) {
        lastError = error as Error;

        const retryExists = (await this.retryButton.count()) > 0;

        if (retryExists && attempt < maxRetries) {
          console.log(`Attempt ${attempt}: Rates not found. Clicking 'Retry' button...`);
          await this.retryButton.click();
          await this.page.waitForTimeout(2000); // Brief wait for the refresh to trigger
        } else if (attempt < maxRetries) {
          console.log(`Attempt ${attempt}: Rates not found. Waiting for auto-load...`);
          await this.page.waitForTimeout(3000);
        }
      }
    }
    throw new Error(`Failed to load return shipping rates after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async returnLabelGeneration() {
    await this.returnQuantityInput.waitFor({ state: 'visible', timeout: 120000 });
    await this.returnQuantityInput.fill('1');
    await this.page.waitForTimeout(3000);
    await this.refreshratesButton.click();
    await this.waitForShippingRatesWithRetry();
    await this.generateReturnLabelButton.waitFor({ state: 'visible', timeout: 40000 });
    await this.generateReturnLabelButton.click();
    console.log('Return label generated and validated successfully');
  }
}
