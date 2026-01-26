import { Page, Locator } from '@playwright/test';

// Shopify Admin Page Locators - All UI elements for Shopify Admin interactions
export class ShopifyAdminLocators {
  readonly page: Page;

  // Search elements
  readonly searchButton: Locator;
  readonly searchContainer: Locator;
  readonly ordersButton: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;

  // More actions menu
  readonly moreActionsButton: Locator;
  readonly generateLabelLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search elements
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.searchContainer = page.locator('#search-container');
    this.ordersButton = this.searchContainer.getByRole('button', { name: 'Orders' });
    this.searchInput = page.getByRole('combobox', { name: 'Search' });
    this.searchResults = page.locator('ul#search-results');

    // More actions menu
    this.moreActionsButton = page.getByRole('button', { name: 'More actions' }).first();
    this.generateLabelLink = page.getByRole('link', { name: 'Generate Label', exact: true });
  }

  // Get order link from search results
  getOrderLink(orderID: string): Locator {
    return this.searchResults.locator(
      `a[role="option"][href*="/orders/"]`,
      { hasText: orderID }
    );
  }
}
