import { Page, Locator } from '@playwright/test';

// Account Selector Locators - UI elements for Shopify "Choose an account" page
export class AccountSelectorLocators {
  readonly page: Page;

  // Page heading to verify we're on account selection page
  readonly heading: Locator;
  
  // Account card element
  readonly accountCards: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page heading for visibility check
    this.heading = page.getByRole('heading', { name: 'Choose an account' });
    
    // Account card buttons
    this.accountCards = page.locator('a.choose-account-card');
  }

  // Get account card by email or username - looks for text within the card
  getAccountCardByText(text: string): Locator {
    return this.page.locator(`a.choose-account-card:has-text("${text}")`);
  }
}
