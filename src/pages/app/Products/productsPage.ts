import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Order Summary Page - Displayed after successful label generation
export class ProductsPage extends BasePage {
  // Locators
  private searchFilterButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.searchFilterButton = this.appFrame.locator('button[aria-label="Search and filter results"]');
  }

  async searchAndSelectProductByName(productName: string) {
    // Click the search filter button
    await this.searchFilterButton.click();
    // Wait for search field to appear and enter product name
    await this.page.keyboard.type(productName);
    await this.appFrame.getByRole('button', { name: productName }).click();
  }
  async addProductDimensions(data: { length: number; width: number; height: number; unit?: 'cm' | 'in' | 'ft' | 'mt' }) {
    await this.appFrame.getByLabel('Length').first().fill(String(data.length));
    await this.appFrame.getByLabel('Width').first().fill(String(data.width));
    await this.appFrame.getByLabel('Height').first().fill(String(data.height));

    if (data.unit) {
      for (const unit of ['lengthUnit', 'widthUnit', 'heightUnit']) {
        await this.appFrame.locator(`select[name="${unit}"]`).selectOption(data.unit);
      }
    }
  }
}
