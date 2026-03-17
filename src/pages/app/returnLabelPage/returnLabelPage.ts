import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../../../helpers/appFrameHelper';

// Page Object for Order Summary Page - Displayed after successful label generation
export class ReturnLabelPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

  // Locators
  readonly returnLabelPageTitle: Locator;
  readonly returnQuantityInput: Locator;
  readonly refreshratesButton: Locator;
  readonly shippingRatesSelection: Locator;
  readonly generateReturnLabelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize locators
    this.returnLabelPageTitle = this.appFrame.locator(`div.Polaris-Page-Header__TitleWrapper > h1`);
    this.returnQuantityInput = this.appFrame.locator('input[name="[object Object].returnQuantity"]');
    this.refreshratesButton = this.appFrame.getByRole('button', { name: 'Refresh Rates' });
    // this.shippingRatesSelection = this.appFrame.locator('input[type="radio"]'); // make sure while using this locotor use [0]
    this.shippingRatesSelection = this.appFrame.getByRole('radio', { name: /FedEx/i });
    this.generateReturnLabelButton = this.appFrame.getByRole('button', { name: 'Generate Return Label' });
  }

  // Verify return label page title 
  async validateReturnLabelTitle(){
    await this.page.reload();
    await expect(this.returnLabelPageTitle).toBeVisible({ timeout: 5000 });
    let something = await expect(this.returnLabelPageTitle).toContainText('Return Label', { timeout: 10000 });
    console.log("Return label page title validation: " + something);
  }

  async returnLabelGeneration(){
    await this.returnQuantityInput.fill('1');
    await this.refreshratesButton.click();
    await this.shippingRatesSelection.first().check(); 
    // await this.waitForShippingRatesWithRetry();
    await this.generateReturnLabelButton.waitFor({ state: 'visible', timeout: 40000 });
    await this.generateReturnLabelButton.click();
    await expect(this.page.getByText('SUCCESS')).toBeVisible();   
  }
}
