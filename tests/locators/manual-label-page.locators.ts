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

  // Get radio button label by ID
  getRadioLabel(radioId: string): Locator {
    return this.frame.locator(`label[for="${radioId}"]`);
  }

  // Get packages section
  getPackagesSection(): Locator {
    return this.frame.getByLabel('Packages', { exact: true });
  }

  // Get more options button (three dots) for error handling
  getMoreOptionsButton(): Locator {
    return this.failedRatesBox.locator('button').filter({
      has: this.frame.locator('svg path[d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"]')
    }).first();
  }

  // Get View XML button in dropdown
  getViewXmlButton(): Locator {
    return this.frame.locator('button[role="menuitem"]').filter({ hasText: 'View XML' }).first();
  }

  // Get modal dialog
  getModal(): Locator {
    return this.frame.locator('div[role="dialog"][aria-modal="true"]');
  }

  // Get modal close button
  getModalCloseButton(): Locator {
    return this.getModal().locator('button[aria-label="Close"]');
  }

  // Get response section in modal
  getModalResponseSection(): Locator {
    return this.getModal().locator('.Polaris-Layout__Section--oneHalf').nth(1);
  }

  // Get XML content in modal
  getModalXmlContent(): Locator {
    return this.getModalResponseSection().locator('pre');
  }
}
