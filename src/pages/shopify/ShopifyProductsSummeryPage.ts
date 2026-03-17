import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyProductsSummaryPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  // Top Actions
  readonly saveButton: Locator;
  readonly discardButton: Locator;

  // Product Basic Details
  readonly productTitleInput: Locator;
  readonly descriptionEditor: Locator;

  // Pricing
  readonly priceInput: Locator;

  // Inventory
  readonly inventoryTrackedCheckbox: Locator;

  // SKU / Barcode
  readonly skuButton: Locator;
  readonly skuInput: Locator;
  readonly barcodeInput: Locator;

  // Shipping
  readonly weightInput: Locator;
  readonly weightUnitDropdown: Locator;
  readonly packageDropdown: Locator;

  // Product Organization
  readonly tagsInput: Locator;

  // Customs
  readonly countryOfOriginButton: Locator;
  readonly countryOfOriginDropdown: Locator;
  readonly hsCodeInput: Locator;

  // Description iframe
  readonly descriptionIframe: Locator;
  readonly descriptionBody: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= ACTION BUTTONS =================

    this.saveButton = this.page.getByRole('button', { name: 'Save' }).first();
    this.discardButton = this.page.getByRole('button', { name: 'Discard' });

    // ================= PRODUCT DETAILS =================

    this.productTitleInput = this.page.locator('input[name="title"]');

    this.descriptionEditor = this.page.locator('#product-description-r85');

    this.descriptionIframe = this.page.locator('#product-description-r20n_ifr');
    this.descriptionBody = this.descriptionIframe.locator('#tinymce');

    // ================= PRICING =================

    this.priceInput = this.page.locator('input[name="price"]');

    // ================= INVENTORY =================

    this.inventoryTrackedCheckbox = this.page.getByRole('checkbox', {
      name: 'Inventory tracked',
    });

    // ================= SKU / BARCODE =================

    this.skuButton = this.page.getByRole('button', { name: 'SKU' });

    this.skuInput = this.page.locator('input[name="sku"]');

    this.barcodeInput = this.page.locator('input[name="barcode"]');

    // ================= SHIPPING =================

    this.weightInput = this.page.locator('#ShippingCardWeight');

    this.weightUnitDropdown = this.page.locator('select[name="weightUnit"]');

    this.packageDropdown = this.page.locator('#package-selector-input');

    // ================= PRODUCT ORGANIZATION =================

    this.tagsInput = this.page.locator('input[name="tags"]');

    // ================= CUSTOMS =================

    this.countryOfOriginButton = this.page.getByRole('button', {
      name: 'Country of origin',
    });

    this.countryOfOriginDropdown = this.page.locator('select[name="countryCodeOfOrigin"]');

    this.hsCodeInput = this.page.locator('input[name="harmonizedSystemCode"]');
  }

  // ================= DYNAMIC LOCATORS =================

  getInventoryInput(locationNumber: string): Locator {
    return this.page.locator(`input[name="inventoryLevels[${locationNumber}]"]`);
  }

  // ================= ACTION METHODS =================

  async setProductTitle(title: string) {
    await this.productTitleInput.fill(title);
  }

  async setDescription(text: string) {
    await this.descriptionBody.click();
    await this.descriptionBody.fill(text);
  }

  async setPrice(price: string) {
    await this.priceInput.fill(price);
  }

  async setInventoryTracked(enable: boolean) {
    const isChecked = await this.inventoryTrackedCheckbox.isChecked();

    if (isChecked !== enable) {
      await this.inventoryTrackedCheckbox.click();
    }
  }

  async setInventory(locationNumber: string, quantity: string) {
    await this.getInventoryInput(locationNumber).fill(quantity);
  }

  async setWeight(weight: string, unit?: 'kg' | 'lb' | 'g' | 'oz') {
    await this.weightInput.fill(String(weight));

    if (unit) {
      const unitMap = {
        lb: 'POUNDS',
        oz: 'OUNCES',
        kg: 'KILOGRAMS',
        g: 'GRAMS',
      };

      await this.weightUnitDropdown.selectOption(unitMap[unit]);
    }
  }

  async setSKU(sku?: string, barcode?: string) {
    await this.skuButton.click();

    if (sku) await this.skuInput.fill(sku);
    if (barcode) await this.barcodeInput.fill(barcode);
  }

  async setCountryOfOrigin(country?: string, hsCode?: string) {
    await this.countryOfOriginButton.click();

    if (country) {
      await this.countryOfOriginDropdown.selectOption(country);
    }

    if (hsCode) {
      await this.hsCodeInput.fill(hsCode);
    }
  }

  async addTag(tag: string) {
    await this.tagsInput.fill(tag);
    await this.page.keyboard.press('Enter');
  }

  async saveProduct() {
    await this.saveButton.click();
  }

  async discardChanges() {
    await this.discardButton.click();
  }
}
