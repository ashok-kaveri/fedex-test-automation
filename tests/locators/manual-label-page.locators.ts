import { FrameLocator, Locator } from '@playwright/test';

// Manual Label Page Locators - All UI elements for the manual label generation page (iframe)
export class ManualLabelPageLocators {
  readonly frame: FrameLocator;

  // Page elements
  readonly heading: Locator;
  readonly generatePackagesButton: Locator;
  readonly getShippingRatesButton: Locator;
  readonly retryButton: Locator;
  readonly generateLabelButton: Locator;
  readonly radioButtons: Locator;
  readonly failedRatesBox: Locator;

  constructor(frame: FrameLocator) {
    this.frame = frame;

    // Page elements
    this.heading = frame.locator('h1');
    this.generatePackagesButton = frame.getByRole('button', { name: 'Generate Packages' });
    this.getShippingRatesButton = frame.getByRole('button', { name: 'Get shipping rates' });
    this.retryButton = frame.getByRole('button', { name: 'Retry' });
    this.generateLabelButton = frame.getByRole('button', { name: 'Generate Label' });
    this.radioButtons = frame.locator('input[type="radio"][name]');
    this.failedRatesBox = frame.locator('div.Polaris-Box').filter({ hasText: 'Failed to fetch rates' });
  }

  // Get shipping service radio button label by radio ID
  getShippingServiceLabel(radioId: string): Locator {
    return this.frame.locator(`label[for="${radioId}"]`);
  }

  // Get three-dot menu button in failed rates error box
  getFailedRatesMenuButton(): Locator {
    return this.failedRatesBox.locator('button').filter({
      has: this.frame.locator('svg path[d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"]')
    }).first();
  }

  // Get 'View XML' menu item in dropdown menu
  getViewXmlMenuItem(): Locator {
    return this.frame.locator('button[role="menuitem"]').filter({ hasText: 'View XML' }).first();
  }

  // Get XML viewer modal dialog
  getXmlViewerModal(): Locator {
    return this.frame.locator('div[role="dialog"][aria-modal="true"]');
  }

  // Get close button in XML viewer modal
  getXmlModalCloseButton(): Locator {
    return this.getXmlViewerModal().locator('button[aria-label="Close"]');
  }

  // Get response section in XML viewer modal
  getXmlModalResponseSection(): Locator {
    return this.getXmlViewerModal().locator('.Polaris-Layout__Section--oneHalf').nth(1);
  }

  // Get XML pre content element in response section
  getXmlModalPreContent(): Locator {
    return this.getXmlModalResponseSection().locator('pre');
  }
}
