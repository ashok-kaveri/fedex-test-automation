import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../../../helpers/appFrameHelper';

// Page Object for Order Summary Page - Displayed after successful label generation
export class ReturnLabelPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

  // Locators
  readonly returnLabelPageTitle: Locator;


  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize locators
    this.returnLabelPageTitle = this.appFrame.locator(`div.Polaris-Page-Header__TitleWrapper > h1`);
  }

  // Verify return label page title 
  async validateReturnLabelTitle(): Promise<void> {
    let something = await expect(this.returnLabelPageTitle).toContainText('Return Label', { timeout: 10000 });
    console.log("Return label page title validation: " + something);
  }
}
