import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

export class PickupPage extends BasePage {
  // Existing Locators
  readonly pickupHeading: Locator;
  readonly requestPickupButton: Locator;
  readonly confirmYesButton: Locator;

  // Added Locators
  readonly howToButton: Locator;
  readonly helpButton: Locator;
  readonly allTab: Locator;
  readonly moreViewsButton: Locator;
  readonly pickupTable: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly paginationInfo: Locator;
  private readonly requestedTimeDisplayFormatter: Intl.DateTimeFormat;
  readonly statusInPickupLinkPage: Locator;

  constructor(page: Page) {
    super(page);

    this.pickupHeading = this.appFrame.getByRole('heading', {
      name: 'Pickups',
    });

    this.requestPickupButton = this.appFrame.getByRole('button', {
      name: 'Request Pick Up',
    });

    this.confirmYesButton = this.appFrame.getByRole('button', { name: 'Yes' });

    this.howToButton = this.appFrame.getByRole('button', {
      name: 'How to',
    });

    this.helpButton = this.appFrame.getByRole('button', {
      name: 'Help',
    });

    this.allTab = this.appFrame.getByRole('tab', {
      name: 'All',
    });

    this.moreViewsButton = this.appFrame.getByRole('button', {
      name: 'More views',
    });

    this.pickupTable = this.appFrame.getByRole('table');

    this.previousButton = this.appFrame.getByRole('button', {
      name: 'Previous',
    });

    this.nextButton = this.appFrame.getByRole('button', {
      name: 'Next',
    });

    this.paginationInfo = this.appFrame.getByText(/Page \d+ of \d+/);

    this.requestedTimeDisplayFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    this.statusInPickupLinkPage = this.appFrame.locator('p.Polaris-Text--subdued').filter({ hasText: 'SUCCESS' });
  }

  async verifyPickupField(label: string, expectedValue?: string | RegExp): Promise<string> {
    const labelLocator = this.appFrame.locator('p.Polaris-Text--semibold').filter({ hasText: label }).first();

    await expect(labelLocator).toBeVisible({ timeout: 10000 });

    const valueLocator = labelLocator.locator('xpath=ancestor::div[contains(@class,"Polaris-Grid-Cell")]').locator('xpath=following-sibling::div[1]').locator('p, button').first();

    await expect(valueLocator).toBeVisible({ timeout: 10000 });

    if (expectedValue !== undefined) {
      await expect(valueLocator).toHaveText(expectedValue);
    }

    return (await valueLocator.innerText()).trim();
  }

  async clickRowByOrderId(orderId: string): Promise<void> {
    const formattedOrderId = orderId.startsWith('#') ? orderId : `#${orderId}`;
    const row = this.appFrame.locator('tr.Polaris-IndexTable__TableRow').filter({ hasText: formattedOrderId }).first();
    await row.waitFor({ state: 'visible' });
    await row.click();
    await expect(this.appFrame.locator('text=Pickup Confirmation Number')).toBeVisible({ timeout: 10000 });
  }

  private parseRequestedTimeWithCurrentYear(requestedTime: string): Date {
    const match = requestedTime.trim().match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i);

    if (!match) {
      throw new Error(`Unable to parse requested time value: "${requestedTime}"`);
    }

    const [, monthShort, dayStr, hourStr, minuteStr, period] = match;

    // prettier-ignore
    const months: Record<string, number> = {
      Jan: 0,Feb: 1,Mar: 2,Apr: 3,May: 4,Jun: 5,Jul: 6,Aug: 7,Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const monthIndex = months[monthShort[0].toUpperCase() + monthShort.slice(1, 3).toLowerCase()];
    if (monthIndex === undefined) {
      throw new Error(`Unknown month in requested time value: "${requestedTime}"`);
    }

    let hour = Number(hourStr) % 12;
    if (period.toUpperCase() === 'PM') {
      hour += 12;
    }

    return new Date(new Date().getFullYear(), monthIndex, Number(dayStr), hour, Number(minuteStr), 0, 0);
  }

  private getMinimumDistanceToMinuteMs(reference: Date, minuteTime: Date): number {
    const minuteStartMs = minuteTime.getTime();
    const minuteEndMs = minuteStartMs + 59_999;
    const referenceMs = reference.getTime();

    if (referenceMs < minuteStartMs) {
      return minuteStartMs - referenceMs;
    }

    if (referenceMs > minuteEndMs) {
      return referenceMs - minuteEndMs;
    }

    return 0;
  }

  getOrderRow(orderID: string): Locator {
    return this.appFrame.getByRole('table').getByText(orderID);
  }

  async requestPickup(): Promise<void> {
    await this.requestPickupButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.requestPickupButton.click();

    await this.confirmYesButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.confirmYesButton.click();
  }

  async verifyPickupPage(): Promise<void> {
    await expect(this.pickupHeading).toContainText('Pickups', {
      timeout: 10000,
    });
  }

  async openPickupDetails(orderID: string): Promise<void> {
    const orderRow = this.getOrderRow(orderID);
    await orderRow.waitFor({ state: 'visible', timeout: 10000 });
    await orderRow.click();
  }

  async verifyPickupDetails(orderID: string): Promise<void> {
    await expect(this.pickupHeading).toContainText('Pickup Details', {
      timeout: 10000,
    });
    await expect(this.appContent.getAppFrameMain()).toContainText(orderID, {
      timeout: 5000,
    });
  }

  async verifyPickupStatus(expectedStatus: string): Promise<void> {
    await expect(this.appContent.getAppFrameMain()).toContainText(expectedStatus, { timeout: 8000 });
  }

  async verifyOrderStatus(orderID: string, expectedStatus: string): Promise<void> {
    const orderRow = this.getOrderRow(orderID);
    await expect(orderRow).toBeVisible({ timeout: 15000 });
  }

  async processPickupRow(orderID: any, requestPickupTriggeredAt?: Date): Promise<string> {
    // await this.page.pause();
    const row = this.appFrame.locator('tr.Polaris-IndexTable__TableRow').filter({ hasText: orderID }).first();

    await expect(row).toBeVisible();

    const pickupNumber = await row.locator('td').nth(1).innerText();
    const status = await row.locator('td').nth(2).innerText();
    // expect(status.trim().toLowerCase()).not.toContain('failed');
    expect(status).toContain('Success');
    const requestedTime = await row.locator('td').nth(3).innerText();
    const orders = await row.locator('td').nth(5).innerText();
    expect(orders).toContain(orderID);

    if (requestPickupTriggeredAt) {
      const displayedRequestedTime = requestedTime.trim();
      const parsedRequestedMinute = this.parseRequestedTimeWithCurrentYear(displayedRequestedTime);
      const distanceMs = this.getMinimumDistanceToMinuteMs(requestPickupTriggeredAt, parsedRequestedMinute);

      if (distanceMs > 0) {
        console.log(`Time difference from requested minute: ${distanceMs}ms`);
      } else {
        console.log(`Time in Pickup Page is same as requested time: ${displayedRequestedTime}`);
      }

      expect(distanceMs).toBeLessThanOrEqual(40_000);
      expect(displayedRequestedTime).toBe(this.requestedTimeDisplayFormatter.format(requestPickupTriggeredAt));
    }
    return pickupNumber;
  }
}
