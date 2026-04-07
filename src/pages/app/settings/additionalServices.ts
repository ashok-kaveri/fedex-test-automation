import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../basePage';

export class AdditionalServices extends BasePage {
  readonly fedexOneRateHeading: Locator;
  readonly fedexOneRateCheckbox: Locator;
  readonly fedexOneRateCheckboxLabel: Locator;
  readonly fedexOneRateSaveButton: Locator;

  // --- Support Duties & Taxes at Checkout using FedEx "Rates and Transit Times" API ---
  readonly additionalServicesHeading: Locator;
  readonly dutiesAndTaxesCheckbox: Locator;
  readonly dutiesAndTaxesCheckboxLabel: Locator;
  readonly dutiesAndTaxesSaveButton: Locator;
  readonly internationalShippingSettingsHeading: Locator;
  readonly rateSettingsHeading: Locator;

  constructor(page: Page) {
    super(page);

    this.fedexOneRateHeading = this.appFrame.getByRole('heading', { name: 'FedEx One Rate®' });
    this.fedexOneRateCheckbox = this.appFrame.locator('input[name="isOneRateEnabled"]');
    this.fedexOneRateCheckboxLabel = this.appFrame.locator('label:has-text("Enable FedEx One Rate®")');
    this.fedexOneRateSaveButton = this.fedexOneRateHeading.filter({ has: this.page.getByRole('button', { name: 'Save' }) });

    // --- Support Duties & Taxes at Checkout using FedEx "Rates and Transit Times" API ---
    this.additionalServicesHeading = this.appFrame.getByRole('heading', { name: 'Additional Services' });
    this.dutiesAndTaxesCheckbox = this.appFrame.locator('input[name="isDutiesAndTaxesEnabled"]');
    this.dutiesAndTaxesCheckboxLabel = this.appFrame.locator('label:has-text("Include Duties and Taxes in Checkout Rates")');
    this.dutiesAndTaxesSaveButton = this.appFrame
      .getByRole('heading', { name: 'Additional Services' })
      .locator('..')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: 'save', exact: false });
    this.internationalShippingSettingsHeading = this.appFrame.getByRole('heading', { name: 'International Shipping Settings' });
    this.rateSettingsHeading = this.appFrame.getByRole('heading', { name: 'Rate Settings' });
  }

  async enableFedexOneRate(enable: boolean) {
    await this.fedexOneRateCheckbox.scrollIntoViewIfNeeded();
    for (let attempt = 0; attempt < 3; attempt++) {
      const isChecked = await this.fedexOneRateCheckbox.isChecked();
      if (isChecked === enable) {
        let isStable = true;
        for (let poll = 0; poll < 4; poll++) {
          await this.page.waitForTimeout(400);
          if ((await this.fedexOneRateCheckbox.isChecked()) !== enable) {
            isStable = false;
            break;
          }
        }
        if (isStable) {
          return;
        }
      }
      await this.fedexOneRateCheckboxLabel.click();
      await this.page.waitForTimeout(750);
      const updatedState = await this.fedexOneRateCheckbox.isChecked();
      if (updatedState === enable) {
        let isStable = true;
        for (let poll = 0; poll < 4; poll++) {
          await this.page.waitForTimeout(400);
          if ((await this.fedexOneRateCheckbox.isChecked()) !== enable) {
            isStable = false;
            break;
          }
        }
        if (isStable) {
          return;
        }
      }
    }
    if (enable) {
      await expect(this.fedexOneRateCheckbox).toBeChecked({ timeout: 3000 });
    } else {
      await expect(this.fedexOneRateCheckbox).not.toBeChecked({ timeout: 3000 });
    }
  }

  async clickAnyButtonUsingHeading(heading: string, buttonName: string) {
    const headingLocator = this.appFrame.getByRole('heading', { name: heading });
    const section = headingLocator.locator('..').locator('..').locator('..');
    await section.getByRole('button', { name: buttonName, exact: true }).click();
  }

  // --- Support Duties & Taxes at Checkout using FedEx "Rates and Transit Times" API ---

  /**
   * Enables or disables the "Include Duties and Taxes in Checkout Rates" toggle.
   * Scrolls into view, checks current state, clicks label if a change is needed,
   * and verifies stability before returning. Falls back to an assertion if unstable.
   */
  async enableDutiesAndTaxes(enable: boolean): Promise<void> {
    await this.dutiesAndTaxesCheckbox.scrollIntoViewIfNeeded();
    for (let attempt = 0; attempt < 3; attempt++) {
      const isChecked = await this.dutiesAndTaxesCheckbox.isChecked();
      if (isChecked === enable) {
        let isStable = true;
        for (let poll = 0; poll < 4; poll++) {
          await this.page.waitForTimeout(400);
          if ((await this.dutiesAndTaxesCheckbox.isChecked()) !== enable) {
            isStable = false;
            break;
          }
        }
        if (isStable) {
          return;
        }
      }
      await this.dutiesAndTaxesCheckboxLabel.click();
      await this.page.waitForTimeout(750);
      const updatedState = await this.dutiesAndTaxesCheckbox.isChecked();
      if (updatedState === enable) {
        let isStable = true;
        for (let poll = 0; poll < 4; poll++) {
          await this.page.waitForTimeout(400);
          if ((await this.dutiesAndTaxesCheckbox.isChecked()) !== enable) {
            isStable = false;
            break;
          }
        }
        if (isStable) {
          return;
        }
      }
    }
    if (enable) {
      await expect(this.dutiesAndTaxesCheckbox).toBeChecked({ timeout: 3000 });
    } else {
      await expect(this.dutiesAndTaxesCheckbox).not.toBeChecked({ timeout: 3000 });
    }
  }

  /**
   * Saves the Additional Services section by clicking the save button
   * scoped to that section heading and waits for the page to settle.
   */
  async saveDutiesAndTaxesSetting(): Promise<void> {
    await this.dutiesAndTaxesSaveButton.scrollIntoViewIfNeeded();
    await this.dutiesAndTaxesSaveButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Reads and returns the current checked state of the Duties and Taxes checkbox.
   */
  async isDutiesAndTaxesEnabled(): Promise<boolean> {
    await this.dutiesAndTaxesCheckbox.scrollIntoViewIfNeeded();
    return this.dutiesAndTaxesCheckbox.isChecked();
  }

  /**
   * Full workflow: set the Duties and Taxes toggle to the desired state and persist it.
   * Returns the final persisted state for assertion in tests.
   */
  async setDutiesAndTaxesAndSave(enable: boolean): Promise<void> {
    await this.enableDutiesAndTaxes(enable);
    await this.saveDutiesAndTaxesSetting();
    // Re-read after save to confirm persistence
    const persisted = await this.isDutiesAndTaxesEnabled();
    if (persisted !== enable) {
      throw new Error(
        `Duties and Taxes setting did not persist after save. Expected: ${enable}, Got: ${persisted}`
      );
    }
  }

  /**
   * Verifies the Additional Services section heading is visible,
   * confirming the page has loaded the relevant section.
   */
  async verifyAdditionalServicesSectionVisible(): Promise<void> {
    await this.additionalServicesHeading.scrollIntoViewIfNeeded();
    await expect(this.additionalServicesHeading).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verifies the International Shipping Settings section heading is visible.
   */
  async verifyInternationalShippingSettingsVisible(): Promise<void> {
    await this.internationalShippingSettingsHeading.scrollIntoViewIfNeeded();
    await expect(this.internationalShippingSettingsHeading).toBeVisible({ timeout: 10000 });
  }
}