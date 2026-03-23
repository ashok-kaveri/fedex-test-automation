import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

// Page Object for Account Selection - Handles "Choose an account" page interactions
export class ShopifyAccountSelectorPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  readonly heading: Locator;
  readonly accountCards: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= ACCOUNT SELECTION =================

    this.heading = this.page.getByRole('heading', { name: 'Choose an account' });

    this.accountCards = this.page.locator('a.choose-account-card');
  }

  // ================= DYNAMIC LOCATORS =================

  getAccountCardByEmail(email: string): Locator {
    return this.accountCards.filter({ hasText: email });
  }

  // ================= ACTION METHODS =================

  async isAccountSelectionPageVisible(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async selectAccountByEmail(email: string) {
    const accountCard = this.getAccountCardByEmail(email);

    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      accountCard.click(),
    ]);
  }

}