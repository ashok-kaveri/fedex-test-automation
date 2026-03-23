import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyStoreSelectionPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  // Store search
  readonly storeSearchInput: Locator;

  // Store list
  readonly storeCards: Locator;



  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= STORE SEARCH =================

    this.storeSearchInput = this.page.locator(
      'input[type="search"], input[placeholder*="search" i]'
    );

    // ================= STORE LIST =================

    this.storeCards = this.page.locator('a');

 
  }

  // ================= DYNAMIC LOCATORS =================

  getStoreByName(storeName: string): Locator {
    return this.storeCards.filter({ hasText: storeName });
  }

  // ================= ACTION METHODS =================

  async searchStore(storeName: string) {
    await this.storeSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.storeSearchInput.fill(storeName);
  }

  async selectStore(storeName: string) {
    const store = this.getStoreByName(storeName);

    await store.waitFor({ state: 'visible', timeout: 10000 });

    await store.click();
  }


  async selectStoreAndProceed(storeName: string) {
    await this.searchStore(storeName);
    await this.selectStore(storeName);
  }
}