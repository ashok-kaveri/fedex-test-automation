import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyDevDashboardStorePage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  // Navigation
  readonly devStoresLink: Locator;

  // Dev Store Actions
  readonly addDevStoreButton: Locator;

  // Dev Store List
  readonly storeCards: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= DEV STORE DASHBOARD =================

    this.devStoresLink = this.page.getByRole('link', { name: 'Dev stores' });

    this.addDevStoreButton = this.page.getByRole('link', { name: 'Add dev store' });

    this.storeCards = this.page.locator('[data-testid="dev-store-card"], .Polaris-Card');
  }

  // ================= DYNAMIC LOCATORS =================

  getStoreByName(storeName: string): Locator {
    return this.storeCards.filter({ hasText: storeName });
  }

  // ================= ACTION METHODS =================

  async navigateToDevStores() {
    await this.devStoresLink.click();

    await this.page.waitForLoadState('networkidle');

    await this.addDevStoreButton.waitFor({ state: 'visible' });
  }

  async openCreateStoreForm(): Promise<Page> {
    const [createStorePage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.addDevStoreButton.click(),
    ]);

    await createStorePage.waitForLoadState('domcontentloaded');
    return createStorePage;
  }

  
}