import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class PackagingSettingsPage extends BasePage {
  // Locators
  readonly volumetricWeightCheckbox: Locator;
  readonly addAdditionalWeight: Locator;
  readonly stackProductsInBoxes: Locator;
  readonly boxesTable: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.volumetricWeightCheckbox = this.appFrame.getByLabel('Use Volumetric Weight For Package Generation');
    this.addAdditionalWeight = this.appFrame.getByLabel('Add Additional Weight To All Packages');
    this.stackProductsInBoxes = this.appFrame.getByLabel('Do You Stack Products In Boxes?');
    this.boxesTable = this.appFrame.locator('tbody tr');
  }

  async settingsDropDownUsingLabel(label: string, value: string) {
    await this.appFrame.getByLabel(label).selectOption({ label: value });
  }

  async clickSettingsButtonUsingLabel(label: string, buttonName: string) {
    const card = this.appFrame.locator('.Polaris-FormLayout__Item').filter({ has: this.appFrame.getByLabel(label) });
    await card.getByRole('button', { name: buttonName }).click();
  }

  async clickSettingsButtonUsingHeading(heading: string, buttonName: string) {
    const headingLocator = this.appFrame.getByRole('heading', { name: heading });

    const section = headingLocator.locator('..').locator('..').locator('..'); // climb until container

    await section.getByRole('button', { name: buttonName, exact: true }).click();
  }

  async setVolumetricWeight(enable: boolean) {
    if (enable) {
      await this.volumetricWeightCheckbox.check({ force: true });
    } else {
      await this.volumetricWeightCheckbox.uncheck({ force: true });
    }
  }

  async setStackProductsInBoxes(enable: boolean) {
    if (enable) {
      await this.stackProductsInBoxes.check({ force: true });
    } else {
      await this.stackProductsInBoxes.uncheck({ force: true });
    }
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
    // Click Restore button inside iframe
    await this.appFrame.getByRole('button', { name: 'Restore FedEx Boxes' }).click();
  }

  async keepOnlyBoxes(allowedBoxes: Record<string, number[]>): Promise<void> {
    const rows = this.boxesTable;
    const total = await rows.count();

    const occurrenceMap: Record<string, number> = {};
    const rowsToDelete: number[] = [];

    // First pass: decide what to delete
    for (let i = 0; i < total; i++) {
      const row = rows.nth(i);
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
      await row.locator('button').last().click();

      await expect(this.boxesTable).toHaveCount(initialCount - 1);
    }
  }

  async openAddCustomBox() {
    await this.appFrame.getByRole('button', { name: /add custom box/i }).click();

    // Wait for modal title
    await expect(this.appFrame.getByRole('heading', { name: 'Add Package' })).toBeVisible();
  }

  get addPackageModal() {
    return this.appFrame.getByRole('dialog', { name: /add package/i });
  }

  // async fillField(label: string, value: string | number, index: number = 0) {
  //   const input = this.appFrame.getByLabel(label).nth(index);
  //   await input.clear();
  //   await input.fill(String(value));
  // }

  async addCustomBox(data: {
    name: string;
    inner: { length: number; width: number; height: number };
    outer: { length: number; width: number; height: number };
    weight: { empty: number; max: number };
  }): Promise<void> {
    await this.openAddCustomBox();

    const modal = this.addPackageModal;

    // Name
    await modal.getByLabel('Name').fill(data.name);

    // Inner Dimensions (index 0)
    await modal.getByLabel('Length').nth(0).fill(String(data.inner.length));
    await modal.getByLabel('Width').nth(0).fill(String(data.inner.width));
    await modal.getByLabel('Height').nth(0).fill(String(data.inner.height));

    // Outer Dimensions (index 1)
    await modal.getByLabel('Length').nth(1).fill(String(data.outer.length));
    await modal.getByLabel('Width').nth(1).fill(String(data.outer.width));
    await modal.getByLabel('Height').nth(1).fill(String(data.outer.height));

    // Weight
    await modal.getByLabel('Box Weight When Empty').fill(String(data.weight.empty));
    await modal.getByLabel('Max Weight').fill(String(data.weight.max));

    // Add Box
    await modal.getByRole('button', { name: 'Add Box' }).click();

    // Wait modal close
    await expect(modal).toBeHidden();
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
    // Fill dimensions
    await this.appFrame.locator('input[name="length"]').fill(String(data.length));
    await this.appFrame.locator('input[name="width"]').fill(String(data.width));
    await this.appFrame.locator('input[name="height"]').fill(String(data.height));

    // // Fill default weight
    // await this.appFrame.getByLabel('Default weight for products (gm):').fill(String(data.weight));

    await this.fillInputByLabel('Default weight for products (gm):', data.weight);

    // Change unit if provided
    if (data.unit) {
      await this.appFrame.locator('select[name="lengthUnit"]').selectOption(data.unit);
      await this.appFrame.locator('select[name="widthUnit"]').selectOption(data.unit);
      await this.appFrame.locator('select[name="heightUnit"]').selectOption(data.unit);
    }
  }

  async addDimensionsForFreight(data: { length: number; width: number; height: number }) {
    const section = this.appFrame.getByRole('heading', { name: 'For FedEx® Freight Services' }).locator('xpath=ancestor::div[contains(@class,"Polaris-BlockStack")]');

    await section.getByLabel('Length').fill(String(data.length));
    await section.getByLabel('Width').fill(String(data.width));
    await section.getByLabel('Height').fill(String(data.height));
  }
}
