import { Page, FrameLocator, Locator } from '@playwright/test';

// Helper class to get FedEx app iframe
export class AppFrameHelper {
  // Static method to get the FedEx app iframe
  static getAppFrame(page: Page): FrameLocator {
    return page.frameLocator('iframe[name="app-iframe"]');
  }
}

// Helper class for app frame content locators
export class AppFrameContentLocators {
  readonly frame: FrameLocator;

  constructor(frame: FrameLocator) {
    this.frame = frame;
  }

  getAppFrameMain(): Locator {
    return this.frame.locator('#AppFrameMain');
  }
}
