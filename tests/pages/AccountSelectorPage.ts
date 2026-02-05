import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { AccountSelectorLocators } from '../locators/account-selector.locators';

// Page Object for Account Selection - Handles "Choose an account" page interactions
export class AccountSelectorPage extends BasePage {
  private readonly locators: AccountSelectorLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new AccountSelectorLocators(page);
  }

  // Check if "Choose an account" page is displayed
  async isAccountSelectionPageVisible(): Promise<boolean> {
    try {
      await this.locators.heading.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  // Select account by email or username
  async selectAccountByText(text: string): Promise<void> {
    const accountCard = this.locators.getAccountCardByText(text);
    await accountCard.waitFor({ state: 'visible', timeout: 5000 });
    await accountCard.click();
    await this.page.waitForTimeout(2000);
  }
}
