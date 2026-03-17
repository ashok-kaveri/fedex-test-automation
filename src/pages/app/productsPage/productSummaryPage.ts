import { Page, Locator, FrameLocator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

export class ProductSummaryPage extends BasePage {
  readonly appIframe: FrameLocator;
  readonly signatureOptionDropdown: Locator;
  readonly saveButton: Locator;
  readonly dryIceLabel: Locator;
  readonly dryIceWeightInput: Locator;
  readonly dryIceCheckbox: Locator;
  readonly isAlcoholLabel: Locator;
  readonly isAlcoholCheckbox: Locator;
  readonly alcoholRecipientTypeDropdown: Locator;
  readonly isBatteryLabel: Locator;
  readonly isBatteryCheckbox: Locator;
  readonly batteryMaterialTypeDropdown: Locator;
  readonly batteryPackingTypeDropdown: Locator;

  constructor(page: Page) {
    super(page);

    this.appIframe = page.frameLocator('iframe[name="app-iframe"]');
    this.signatureOptionDropdown = this.appIframe.locator('select[name="signatureOptionType"]');
    this.saveButton = this.appIframe.locator('span.Polaris-Button__Text:has-text("Save")').nth(0);
    this.dryIceLabel = this.appIframe.getByText('Is Dry Ice Needed');
    this.dryIceWeightInput = this.appIframe.getByRole('spinbutton', { name: 'Dry Ice Weight(kg)' });
    this.dryIceCheckbox = this.appIframe.getByRole('checkbox', { name: 'Is Dry Ice Needed' });

    this.isAlcoholLabel = this.appIframe.getByText('Is Alcohol');
    this.isAlcoholCheckbox = this.appIframe.getByRole('checkbox', { name: 'Is Alcohol' });
    this.alcoholRecipientTypeDropdown = this.appIframe.getByLabel('Alcohol Recipient Type');

    this.isBatteryLabel = this.appIframe.getByText('Is Battery');
    this.isBatteryCheckbox = this.appIframe.getByRole('checkbox', { name: 'Is Battery' });
    this.batteryMaterialTypeDropdown = this.appIframe.getByLabel('Battery Material Type');
    this.batteryPackingTypeDropdown = this.appIframe.getByLabel('Battery Packing Type');
  }

  // Set the signature type (e.g., 'ADULT', 'SERVICE_DEFAULT', 'DIRECT', "INDIRECT", "NO_SIGNATURE_REQUIRED", "AS_PER_THE_GENERAL_SETTINGS")
  async setSignatureType(signatureType: string): Promise<void> {
    await this.signatureOptionDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.signatureOptionDropdown.click();
    await this.signatureOptionDropdown.selectOption(signatureType);
  }

  // Save the product settings
  async saveProductSettings(): Promise<void> {
    await this.saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveButton.click();
  }

  // Update product signature (assertion to be handled in test)
  async updateProductSignature(signatureType: string): Promise<void> {
    await this.setSignatureType(signatureType);
    await this.saveProductSettings();
  }

  // Helper to get selected signature label for verification in tests
  async getSelectedSignatureLabel(): Promise<string> {
    return await this.signatureOptionDropdown.evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex].text);
  }

  // Update dry ice weight (assertion to be handled in test)
  async updateProductDryIce(dryIceWeight: string): Promise<void> {
    await this.dryIceLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Check if it's already checked before clicking
    if (!(await this.dryIceCheckbox.isChecked())) {
      await this.dryIceLabel.click();
    }
    await this.dryIceWeightInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.dryIceWeightInput.clear();
    await this.dryIceWeightInput.fill(dryIceWeight);
    await this.saveProductSettings();
  }

  // Update alcohol recipient (assertion to be handled in test)
  async updateProductAlcohol(recipientType: string): Promise<void> {
    await this.isAlcoholLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Check if it's already checked before clicking
    if (!(await this.isAlcoholCheckbox.isChecked())) {
      await this.isAlcoholLabel.click();
    }
    await this.alcoholRecipientTypeDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.alcoholRecipientTypeDropdown.selectOption(recipientType);
    await this.saveProductSettings();
  }

  // Update battery settings (assertion to be handled in test)
  async updateProductBattery(materialType: string, packingType: string): Promise<void> {
    await this.isBatteryLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Check if it's already checked before clicking
    if (!(await this.isBatteryCheckbox.isChecked())) {
      await this.isBatteryLabel.click();
    }

    await this.batteryMaterialTypeDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.batteryMaterialTypeDropdown.selectOption(materialType);

    await this.batteryPackingTypeDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.batteryPackingTypeDropdown.selectOption(packingType);

    await this.saveProductSettings();
  }

  async disableIsBattery() {
    await this.isBatteryLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Check if it's already checked before clicking
    if (await this.isBatteryCheckbox.isChecked()) {
      await this.isBatteryLabel.click();
    }
    await this.saveProductSettings();
  }

  async disableIsDryIce() {
    await this.dryIceLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Check if it's already checked before clicking
    if (await this.dryIceCheckbox.isChecked()) {
      await this.dryIceLabel.click();
    }
    await this.saveProductSettings();
  }

  async disableIsAlcohol() {
    await this.isAlcoholLabel.waitFor({ state: 'visible', timeout: 10000 });
    // Check if it's already checked before clicking
    if (await this.isAlcoholCheckbox.isChecked()) {
      await this.isAlcoholLabel.click();
    }
    await this.saveProductSettings();
  }

  async disableSpecialService(service: 'battery' | 'dryIce' | 'alcohol') {
    const config = {
      battery: {
        label: this.isBatteryLabel,
        checkbox: this.isBatteryCheckbox,
      },
      dryIce: {
        label: this.dryIceLabel,
        checkbox: this.dryIceCheckbox,
      },
      alcohol: {
        label: this.isAlcoholLabel,
        checkbox: this.isAlcoholCheckbox,
      },
    };

    const { label, checkbox } = config[service];

    await label.waitFor({ state: 'visible', timeout: 10_000 });

    if (await checkbox.isChecked()) {
      await label.click();
      // Wait for the UI to register the click and the checkbox to be unchecked
      await expect(checkbox).not.toBeChecked({ timeout: 5000 });
      await this.saveProductSettings();
    }
  }
}
