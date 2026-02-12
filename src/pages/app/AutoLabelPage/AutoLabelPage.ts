import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameHelper } from '../../../helpers/appFrameHelper';

// Page Object for Manual Label Generation Page within FedEx App - Handles all actions related to manual label generation
export class AutoLabelPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;

  // Locators
  readonly orderCheckbox: Locator;
  readonly moreActionsButton: Locator;
  readonly autoGenerateLabelsOption: Locator;
  readonly pageHeading: Locator;
  readonly orderRow: Locator;
  readonly orderStatus: Locator; 
  
constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);

  

    // // Initialize locators
    this.orderCheckbox = this.orderCheckbox = this.appFrame.getByRole('checkbox').first();
    this.moreActionsButton = this.appFrame.locator('button:has(s-internal-icon[type="menu-horizontal"])').first();
    this.autoGenerateLabelsOption = this.appFrame.locator('button:has(s-internal-icon[type="menu-horizontal"])').first();
    this.pageHeading = this.pageHeading = this.appFrame.getByRole('heading', {name: 'All Orders',exact: true});
    this.orderRow = this.appFrame.locator('.Polaris-IndexTable__TableRow')
    this.orderStatus = this.page.frameLocator('iframe').getByText('label generated', { exact: true });



  }


  
}
