import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../basePage';

export class AdditionalServices extends BasePage {
  readonly fedexOneRateHeading: Locator;
  readonly fedexOneRateCheckbox: Locator;
  readonly fedexOneRateCheckboxLabel: Locator;
  readonly fedexOneRateSaveButton: Locator;

  constructor(page: Page) {
    super(page);

    this.fedexOneRateHeading = this.appFrame.getByRole('heading', { name: 'FedEx One Rate®' });
    this.fedexOneRateCheckbox = this.appFrame.locator('input[name="isOneRateEnabled"]');
    this.fedexOneRateCheckboxLabel = this.appFrame.locator('label:has-text("Enable FedEx One Rate®")');
    this.fedexOneRateSaveButton = this.fedexOneRateHeading.filter({ has: this.page.getByRole('button', { name: 'Save' }) });
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
}
