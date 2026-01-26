import { FrameLocator, Locator } from '@playwright/test';

// Pickup Page Locators - All UI elements for the Pickup page within FedEx app (iframe)
export class PickupPageLocators {
  readonly frame: FrameLocator;

  // Page elements
  readonly pickupHeading: Locator;
  readonly requestPickupButton: Locator;
  readonly confirmYesButton: Locator;

  constructor(frame: FrameLocator) {
    this.frame = frame;

    // Page elements
    this.pickupHeading = frame.getByRole('heading');
    this.requestPickupButton = frame.getByRole('button', { name: 'Request Pick Up' });
    this.confirmYesButton = frame.getByRole('button', { name: 'Yes' });
  }

  // Get order row in pickup table
  getOrderRow(orderID: string): Locator {
    return this.frame.getByRole('table').getByText(orderID);
  }
}
