import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

// Page Object for Account Selection - Handles "Choose an account" page interactions
export class ShopifyAccountSelectorPage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly accountCards: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.heading = page.getByRole('heading', { name: 'Choose an account' });
    this.accountCards = page.locator('a.choose-account-card');
  }

  // Helper method for dynamic locators
  getAccountCardByText(text: string): Locator {
    return this.page.locator(`a.choose-account-card:has-text("${text}")`);
  }

  // Check if "Choose an account" page is displayed
  async isAccountSelectionPageVisible(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  // Select account by email or username
  async selectAccountByText(text: string): Promise<void> {
    const accountCard = this.getAccountCardByText(text);
    await accountCard.waitFor({ state: 'visible', timeout: 5000 });
    await accountCard.click();
    await this.page.waitForTimeout(2000);
  }
}
