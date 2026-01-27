import { FrameLocator, Locator } from '@playwright/test';

// App Frame Content Locators - Main content area elements within the FedEx app iframe
export class AppFrameContentLocators {
  readonly frame: FrameLocator;

  constructor(frame: FrameLocator) {
    this.frame = frame;
  }

  // Get main app content area
  getAppFrameMain(): Locator {
    return this.frame.locator('#AppFrameMain');
  }
}
