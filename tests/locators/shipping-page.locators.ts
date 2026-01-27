import { FrameLocator, Locator } from '@playwright/test';

// Shipping Page Locators - All UI elements for the Shipping page within FedEx app (iframe)
export class ShippingPageLocators {
  readonly frame: FrameLocator;

  // Navigation
  readonly ordersButton: Locator;

  // Search elements
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly ordersTable: Locator;

  // Actions
  readonly moreActionsButton: Locator;
  readonly selectAllCell: Locator;

  constructor(frame: FrameLocator) {
    this.frame = frame;

    // Navigation
    this.ordersButton = frame.getByRole('button', { name: 'Orders' });

    // Search elements
    this.searchButton = frame.getByRole('button', { name: 'Search and filter results' });
    this.searchInput = frame.getByRole('textbox', { name: /Search by order id/ });
    this.ordersTable = frame.getByRole('table');

    // Actions
    this.moreActionsButton = frame.getByRole('button', { name: 'More actions' }).first();
    this.selectAllCell = frame.getByRole('cell', { name: 'Select all orders' });
  }

  // Get order row in table
  getOrderRow(orderID: string): Locator {
    return this.ordersTable.getByText(orderID);
  }
}
