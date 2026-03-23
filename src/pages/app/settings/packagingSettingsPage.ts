import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class PackagingSettingsPage extends BasePage {
  // Locators
  readonly volumetricWeightCheckbox: Locator;
  readonly addAdditionalWeight: Locator;
  readonly stackProductsInBoxes: Locator;
  readonly boxesTable: Locator;

  readonly defaultProductLengthInput: Locator;
  readonly defaultProductWidthInput: Locator;
  readonly defaultProductHeightInput: Locator;
  readonly defaultProductWeightInput: Locator;

  readonly defaultProductLengthUnitDropdown: Locator;
  readonly defaultProductWidthUnitDropdown: Locator;
  readonly defaultProductHeightUnitDropdown: Locator;

  readonly restoreFedexBoxesButton: Locator;
  readonly fedexBoxesHeader: Locator;

  readonly freightServicesSection: Locator;

  readonly freightLengthInput: Locator;
  readonly freightWidthInput: Locator;
  readonly freightHeightInput: Locator;

  readonly addCustomBoxButton: Locator;
  readonly addPackageModal: Locator;
  readonly addPackageModalTitle: Locator;

  readonly customBoxNameInput: Locator;

  readonly innerBoxLengthInput: Locator;
  readonly innerBoxWidthInput: Locator;
  readonly innerBoxHeightInput: Locator;

  readonly outerBoxLengthInput: Locator;
  readonly outerBoxWidthInput: Locator;
  readonly outerBoxHeightInput: Locator;

  readonly emptyBoxWeightInput: Locator;
  readonly maxBoxWeightInput: Locator;

  readonly addBoxButton: Locator;

  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.volumetricWeightCheckbox = this.appFrame.getByLabel('Use Volumetric Weight For Package Generation');
    this.addAdditionalWeight = this.appFrame.getByLabel('Add Additional Weight To All Packages');
    this.stackProductsInBoxes = this.appFrame.getByLabel('Do You Stack Products In Boxes?');
    this.boxesTable = this.appFrame.locator('tbody tr');

    // FedEx boxes locators
    this.restoreFedexBoxesButton = this.appFrame.getByRole('button', { name: 'Restore FedEx Boxes' });
    this.fedexBoxesHeader = this.appFrame.locator('th', { hasText: 'FedEx' }).first();

    // Default product dimensions locators
    this.defaultProductLengthInput = this.appFrame.locator('input[name="length"]');
    this.defaultProductWidthInput = this.appFrame.locator('input[name="width"]');
    this.defaultProductHeightInput = this.appFrame.locator('input[name="height"]');

    this.defaultProductWeightInput = this.appFrame.getByLabel('Default weight for products (gm):');

    this.defaultProductLengthUnitDropdown = this.appFrame.locator('select[name="lengthUnit"]');
    this.defaultProductWidthUnitDropdown = this.appFrame.locator('select[name="widthUnit"]');
    this.defaultProductHeightUnitDropdown = this.appFrame.locator('select[name="heightUnit"]');

    // Freight services locators
    this.freightServicesSection = this.appFrame.getByRole('heading', { name: 'For FedEx® Freight Services' }).locator('xpath=ancestor::div[contains(@class,"Polaris-BlockStack")]');

    this.freightLengthInput = this.freightServicesSection.getByLabel('Length');
    this.freightWidthInput = this.freightServicesSection.getByLabel('Width');
    this.freightHeightInput = this.freightServicesSection.getByLabel('Height');

    // Add custom box locators
    this.addCustomBoxButton = this.appFrame.getByRole('button', { name: /add custom box/i });

    this.addPackageModal = this.appFrame.getByRole('dialog', { name: /add package/i });

    this.addPackageModalTitle = this.addPackageModal.getByRole('heading', { name: 'Add Package' });

    this.customBoxNameInput = this.addPackageModal.getByLabel('Name');

    this.innerBoxLengthInput = this.addPackageModal.getByLabel('Length').nth(0);
    this.innerBoxWidthInput = this.addPackageModal.getByLabel('Width').nth(0);
    this.innerBoxHeightInput = this.addPackageModal.getByLabel('Height').nth(0);

    this.outerBoxLengthInput = this.addPackageModal.getByLabel('Length').nth(1);
    this.outerBoxWidthInput = this.addPackageModal.getByLabel('Width').nth(1);
    this.outerBoxHeightInput = this.addPackageModal.getByLabel('Height').nth(1);

    this.emptyBoxWeightInput = this.addPackageModal.getByLabel('Box Weight When Empty');
    this.maxBoxWeightInput = this.addPackageModal.getByLabel('Max Weight');

    this.addBoxButton = this.addPackageModal.getByRole('button', { name: 'Add Box' });
    this.backButton = this.appFrame.getByRole('button', { name: 'Settings' });
  }

  async settingsDropDownUsingLabel(label: string, value: string) {
    const dropdown = this.appFrame.getByLabel(label);

    await dropdown.selectOption(value);

    // wait until Polaris UI updates visible text
    // eslint-disable-next-line no-restricted-syntax
    const container = dropdown.locator('..');
    // eslint-disable-next-line no-restricted-syntax
    await expect(container.locator('.Polaris-Select__SelectedOption')).toBeVisible();

    // trigger blur so React registers change
    await dropdown.blur();
  }

  async clickSettingsButtonUsingLabel(label: string, buttonName: string) {
    // eslint-disable-next-line no-restricted-syntax
    const card = this.appFrame.locator('.Polaris-FormLayout__Item').filter({ has: this.appFrame.getByLabel(label) });
    await card.getByRole('button', { name: buttonName }).click();
  }

  async clickSettingsButtonUsingHeading(heading: string, buttonName: string) {
    const headingLocator = this.appFrame.getByRole('heading', { name: heading });

    // eslint-disable-next-line no-restricted-syntax
    const section = headingLocator.locator('..').locator('..').locator('..'); // climb until container

    await section.getByRole('button', { name: buttonName, exact: true }).click();
  }

  async setCheckbox(labelText: string, enable: boolean) {
    const checkbox = this.appFrame.getByRole('checkbox', { name: labelText });

    if ((await checkbox.isChecked()) !== enable) {
      await this.page.waitForTimeout(1500);
      await this.appFrame.getByText(labelText).click();
    }

    enable ? await expect(checkbox).toBeChecked() : await expect(checkbox).not.toBeChecked();
  }

  async setAdditionalWeight(enable: boolean) {
    if (enable) {
      await this.addAdditionalWeight.check({ force: true });
    } else {
      await this.addAdditionalWeight.uncheck({ force: true });
    }
  }

  async fillInputByLabel(label: string, value: string | number) {
    const input = this.appFrame.getByLabel(label);

    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.clear();
    await input.fill(String(value));
  }

  async restoreFedExBoxes() {
    await this.restoreFedexBoxesButton.click();
    // await this.fedexBoxesHeader.waitFor({ timeout: 2000 });
    await this.expectToast('Restored carrier boxes');
  }

  async keepOnlyBoxes(allowedBoxes: Record<string, number[]>): Promise<void> {
    const rows = this.boxesTable;
    const total = await rows.count();

    const occurrenceMap: Record<string, number> = {};
    const rowsToDelete: number[] = [];

    // First pass: decide what to delete
    for (let i = 0; i < total; i++) {
      const row = rows.nth(i);
      // eslint-disable-next-line no-restricted-syntax
      const boxName = (await row.locator('th').textContent())?.trim() || '';

      occurrenceMap[boxName] = (occurrenceMap[boxName] || 0) + 1;
      const currentIndex = occurrenceMap[boxName];

      const allowedIndexes = allowedBoxes[boxName] || [];

      if (!allowedIndexes.includes(currentIndex)) {
        rowsToDelete.push(i);
      }
    }

    // Second pass: delete from bottom (important)
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      const index = rowsToDelete[i];
      const row = this.boxesTable.nth(index);

      const initialCount = await this.boxesTable.count();
      // eslint-disable-next-line no-restricted-syntax
      await row.locator('button').last().click();

      await expect(this.boxesTable).toHaveCount(initialCount - 1);
    }
  }

  async openAddCustomBox() {
    await this.addCustomBoxButton.click();
    // Wait for modal title
    await expect(this.addPackageModalTitle).toBeVisible();
  }

  async addCustomBox(data: {
    name: string;
    inner: { length: number; width: number; height: number };
    outer: { length: number; width: number; height: number };
    weight: { empty: number; max: number };
  }): Promise<void> {
    await this.openAddCustomBox();

    await this.customBoxNameInput.fill(data.name);

    await this.innerBoxLengthInput.fill(String(data.inner.length));
    await this.innerBoxWidthInput.fill(String(data.inner.width));
    await this.innerBoxHeightInput.fill(String(data.inner.height));

    await this.outerBoxLengthInput.fill(String(data.outer.length));
    await this.outerBoxWidthInput.fill(String(data.outer.width));
    await this.outerBoxHeightInput.fill(String(data.outer.height));

    await this.emptyBoxWeightInput.fill(String(data.weight.empty));
    await this.maxBoxWeightInput.fill(String(data.weight.max));

    await this.addBoxButton.click();

    await expect(this.addPackageModal).toBeHidden();
  }

  getBoxRowByName(name: string) {
    return this.boxesTable.filter({
      hasText: name,
    });
  }

  async savePackagingDetails() {
    await this.appFrame.getByRole('button', { name: 'Save' }).click();
  }

  async setDefaultProductDimensions(data: { length: number; width: number; height: number; weight: number; unit?: 'cm' | 'in' | 'ft' | 'mt' }) {
    await this.defaultProductLengthInput.fill(String(data.length));
    await this.defaultProductWidthInput.fill(String(data.width));
    await this.defaultProductHeightInput.fill(String(data.height));

    await this.defaultProductWeightInput.fill(String(data.weight));

    if (data.unit) {
      await this.defaultProductLengthUnitDropdown.selectOption(data.unit);
      await this.defaultProductWidthUnitDropdown.selectOption(data.unit);
      await this.defaultProductHeightUnitDropdown.selectOption(data.unit);
    }
  }

  async addDimensionsForFreight(data: { length: number; width: number; height: number }) {
    await this.freightLengthInput.fill(String(data.length));
    await this.freightWidthInput.fill(String(data.width));
    await this.freightHeightInput.fill(String(data.height));
  }
}
