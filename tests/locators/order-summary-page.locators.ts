import { FrameLocator, Locator } from '@playwright/test';

// Order Summary Page Locators - All UI elements for the order summary page displayed after label generation
export class OrderSummaryPageLocators {
  readonly frame: FrameLocator;

  // Page elements
  readonly packagesSection: Locator;

  constructor(frame: FrameLocator) {
    this.frame = frame;

    // Page elements
    this.packagesSection = frame.getByLabel('Packages', { exact: true });
  }
}
