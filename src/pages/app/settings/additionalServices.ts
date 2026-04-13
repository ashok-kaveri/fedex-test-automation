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

  // --- Dry Ice for FedEx ---
  readonly dryIceHeading: Locator;
  readonly dryIceToggleCheckbox: Locator;
  readonly dryIceToggleLabel: Locator;
  readonly dryIceWeightInput: Locator;
  readonly dryIceWeightUnitSelect: Locator;
  readonly dryIceSaveButton: Locator;
  readonly dryIceSection: Locator;
  readonly dryIceSuccessBanner: Locator;

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

    // --- Dry Ice for FedEx ---
    this.dryIceHeading = this.appFrame.getByRole('heading', { name: 'Dry Ice' });
    this.dryIceToggleCheckbox = this.appFrame.locator('input[name="isDryIceEnabled"]');
    this.dryIceToggleLabel = this.appFrame.locator('label:has-text("Enable Dry Ice Support")');
    this.dryIceWeightInput = this.appFrame.locator('input[name="dryIceWeight"]');
    this.dryIceWeightUnitSelect = this.appFrame.locator('select[name="dryIceWeightUnit"]');
    this.dryIceSection = this.appFrame.getByRole('heading', { name: 'Dry Ice' }).locator('..').locator('..').locator('..');
    this.dryIceSaveButton = this.dryIceSection.getByRole('button', { name: 'save', exact: false });
    this.dryIceSuccessBanner = this.appFrame.locator('text=Dry Ice settings saved');
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
   * and verifies stability before returning.
   */
  async enableDutiesAndTaxes(enable: boolean) {
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

  // --- Dry Ice for FedEx ---

  /**
   * Enables or disables the "Enable Dry Ice Support" toggle.
   * Scrolls the toggle into view, checks current state, clicks the label if a
   * change is needed, and verifies stability across multiple polls before returning.
   * Throws an assertion error if the desired state cannot be reached after 3 attempts.
   */
  async enableDryIceSupport(enable: boolean): Promise<void> {
    await this.dryIceToggleCheckbox.scrollIntoViewIfNeeded();
    for (let attempt = 0; attempt < 3; attempt++) {
      const isChecked = await this.dryIceToggleCheckbox.isChecked();
      if (isChecked === enable) {
        let isStable = true;
        for (let poll = 0; poll < 4; poll++) {
          await this.page.waitForTimeout(400);
          if ((await this.dryIceToggleCheckbox.isChecked()) !== enable) {
            isStable = false;
            break;
          }
        }
        if (isStable) {
          return;
        }
      }
      await this.dryIceToggleLabel.click();
      await this.page.waitForTimeout(750);
      const updatedState = await this.dryIceToggleCheckbox.isChecked();
      if (updatedState === enable) {
        let isStable = true;
        for (let poll = 0; poll < 4; poll++) {
          await this.page.waitForTimeout(400);
          if ((await this.dryIceToggleCheckbox.isChecked()) !== enable) {
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
      await expect(this.dryIceToggleCheckbox).toBeChecked({ timeout: 3000 });
    } else {
      await expect(this.dryIceToggleCheckbox).not.toBeChecked({ timeout: 3000 });
    }
  }

  /**
   * Enters the specified weight value into the dry ice weight input field.
   * Clears any existing value before typing the new one.
   */
  async enterDryIceWeight(weight: string): Promise<void> {
    await this.dryIceWeightInput.scrollIntoViewIfNeeded();
    await this.dryIceWeightInput.clear();
    await this.dryIceWeightInput.fill(weight);
  }

  /**
   * Selects the dry ice weight unit (e.g. "kg" or "lbs") from the unit dropdown.
   * Waits briefly after selection to allow any reactive UI updates to settle.
   */
  async selectDryIceWeightUnit(unit: string): Promise<void> {
    await this.dryIceWeightUnitSelect.scrollIntoViewIfNeeded();
    await this.dryIceWeightUnitSelect.selectOption({ value: unit });
    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks the Save button scoped to the Dry Ice section.
   * Waits for the success banner to appear and asserts its visibility.
   */
  async saveDryIceSettings(): Promise<void> {
    await this.dryIceSaveButton.scrollIntoViewIfNeeded();
    await this.dryIceSaveButton.click();
    await expect(this.dryIceSuccessBanner).toBeVisible({ timeout: 10000 });
  }

  /**
   * Configures the full dry ice settings in one call:
   * 1. Enables or disables the toggle.
   * 2. If enabling, enters the weight and selects the unit.
   * 3. Saves and asserts the success banner.
   */
  async configureDryIce(enable: boolean, weight?: string, unit?: string): Promise<void> {
    await this.enableDryIceSupport(enable);
    if (enable) {
      if (weight !== undefined) {
        await this.enterDryIceWeight(weight);
      }
      if (unit !== undefined) {
        await this.selectDryIceWeightUnit(unit);
      }
    }
    await this.saveDryIceSettings();
  }

  /**
   * Verifies that the dry ice toggle reflects the expected enabled/disabled state.
   * Used for post-save or post-refresh assertions.
   */
  async assertDryIceToggleState(expectedEnabled: boolean): Promise<void> {
    await this.dryIceToggleCheckbox.scrollIntoViewIfNeeded();
    if (expectedEnabled) {
      await expect(this.dryIceToggleCheckbox).toBeChecked({ timeout: 5000 });
    } else {
      await expect(this.dryIceToggleCheckbox).not.toBeChecked({ timeout: 5000 });
    }
  }

  /**
   * Verifies that the dry ice weight input contains the expected value.
   * Used for post-save or post-refresh persistence assertions.
   */
  async assertDryIceWeightValue(expectedWeight: string): Promise<void> {
    await this.dryIceWeightInput.scrollIntoViewIfNeeded();
    await expect(this.dryIceWeightInput).toHaveValue(expectedWeight, { timeout: 5000 });
  }

  /**
   * Verifies that the dry ice weight unit dropdown has the expected selected value.
   * Used for post-save or post-refresh persistence assertions.
   */
  async assertDryIceWeightUnit(expectedUnit: string): Promise<void> {
    await this.dryIceWeightUnitSelect.scrollIntoViewIfNeeded();
    await expect(this.dryIceWeightUnitSelect).toHaveValue(expectedUnit, { timeout: 5000 });
  }

  /**
   * Scrolls the Dry Ice section into view.
   * Useful as a navigation step before interacting with dry ice controls.
   */
  async scrollToDryIceSection(): Promise<void> {
    await this.dryIceHeading.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to the Additional Services / Settings page via the app sidebar.
   * Waits for the Rate Settings heading to confirm the page has loaded.
   */
  async navigateToAdditionalServices(): Promise<void> {
    await this.clickAppButton();
    await this.selectAppMenu('settings');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);
    await this.rateSettingsHeading.waitFor({ state: 'visible', timeout: 15000 });
  }
}