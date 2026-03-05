import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class ReturnLabelPage extends BasePage {
  // Locators
  readonly returnLabelPageTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.returnLabelPageTitle = this.appFrame.locator(`div.Polaris-Page-Header__TitleWrapper > h1`);
  }

  // Verify return label page title
  async validateReturnLabelTitle(): Promise<void> {
    let something = await expect(this.returnLabelPageTitle).toContainText('Return Label', { timeout: 10000 });
    console.log('Return label page title validation: ' + something);
  }
}
