import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';
import { StoreProducts, Product } from '../../config/product.types';
import { ShopifyProductResponse } from '../../config/product.types';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(__dirname, '../../../testData/products/productsconfig.json');

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

  //weight
  readonly productWeight: Locator;

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

    // ================= Weight=================

    this.productWeight = this.page.locator('#ShippingCardWeight');

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

  async getProductWeight(): Promise<string> {
    const textContent = await this.productWeight.inputValue();
    return textContent?.trim() || '';
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

  getProductAddedMessage(productName: string) {
    return this.page.getByRole('heading', {
      name: new RegExp(`Added ${productName}`, 'i'),
    });
  }

  getProductIdFromPage(page: Page): number {
    const url = page.url();
    const match = url.match(/\/products\/(\d+)/);
    if (!match) {
      throw new Error(`Product ID not found in URL: ${url}`);
    }
    return Number(match[1]);
  }

  async getProductJson(store: string, productId: number) {
    return await this.page.evaluate(
      async ({ store, productId }) => {
        const res = await fetch(`https://admin.shopify.com/store/${store}/products/${productId}.json`);
        return res.json();
      },
      { store, productId },
    );
  }

  extractProductData(productJson: ShopifyProductResponse): Product {
    if (!productJson?.product?.variants?.length) {
      throw new Error('No variants found in product JSON');
    }
    return {
      product_id: productJson.product.id,
      variant_id: productJson.product.variants[0].id,
    };
  }

  updateProductConfig(store: string, type: keyof StoreProducts, product: Product) {
    // read latest JSON
    const config: Record<string, StoreProducts> = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    // create store if not exists
    if (!config[store]) {
      config[store] = {
        simple: [],
        variable: [],
        digital: [],
        dangerous: [],
      };
    }
    // avoid duplicates
    const exists = config[store][type].some((p) => p.product_id === product.product_id);

    if (!exists) {
      config[store][type].push(product);
    }
    // write back to JSON file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}
