import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export interface StoreDetails {
  storeName: string;
  plan: string;
}

export class ShopifyCreateStoreFormPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  readonly storeNameInput: Locator;
  readonly planDropdown: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= CREATE STORE FORM =================

    this.storeNameInput = this.page.getByLabel('Store name');

    this.planDropdown = this.page.locator('select[name="Shopify plan"]');

    this.createButton = this.page.getByRole('button', { name: /create/i }).last();
  }

  // ================= ACTION METHODS =================

  async fillStoreName(storeName: string) {
    await this.storeNameInput.fill(storeName);
  }

  async selectPlan(plan: string) {
    await this.planDropdown.selectOption({ label: plan });
  }

  async submitStoreCreation() {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.createButton.click(),
    ]);
  }

  async createStore(storeDetails: StoreDetails) {
    await this.fillStoreName(storeDetails.storeName);
    await this.selectPlan(storeDetails.plan);
    await this.submitStoreCreation();
  }
}