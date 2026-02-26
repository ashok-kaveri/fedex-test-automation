import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../../../helpers/appFrameHelper';

export class PickupPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;

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
  readonly pickUpDetailsHeading: Locator;
  readonly navigateToPickupDetailsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    this.pickupHeading = this.appFrame.getByRole('heading', {
      name: 'Pickups',
    });

    this.pickUpDetailsHeading = this.appFrame.getByRole('heading', {
      name: 'Pickup Details',
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
    this.navigateToPickupDetailsLink = this.appFrame.locator('[data-primary-link="true"]');
  }

  private getPickupRowWithOrderID(orderID: string): Locator {
    return this.appFrame.locator('tr.Polaris-IndexTable__TableRow').filter({ hasText: orderID }).first();
  }

  private getPickupPageColumns(row: any) {
    return {
      pickupNumber: row.locator('td').nth(1),
      status: row.locator('td').nth(2),
      requestedTime: row.locator('td').nth(3),
      orders: row.locator('td').nth(5),
    };
  }

  async verifyPickupDetails(label: string, expectedValue?: string | RegExp): Promise<string> {
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
    const row = this.getPickupRowWithOrderID(orderId);
    await expect(row).toBeVisible();
    await row.locator('[data-primary-link="true"]').click();
    await expect(this.pickUpDetailsHeading).toBeVisible();
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

  async verifyPickupRowColumns(orderID: any, requestPickupTriggeredAt?: Date): Promise<string> {
    const row = this.getPickupRowWithOrderID(orderID);
    await expect(row).toBeVisible();

    const columns = this.getPickupPageColumns(row);

    const status = await columns.status.innerText();
    expect(status).toContain('Success');

    const pickupNumber = await columns.pickupNumber.innerText();

    const requestedTime = await columns.requestedTime.innerText();

    const orders = await columns.orders.innerText();
    expect(orders).toContain(orderID);

    if (requestPickupTriggeredAt) {
      const displayedRequestedTime = requestedTime.trim();
      const parsedRequestedMinute = this.parseRequestedTimeWithCurrentYear(displayedRequestedTime);
      const distanceMs = this.getMinimumDistanceToMinuteMs(requestPickupTriggeredAt, parsedRequestedMinute);

      expect(distanceMs).toBeLessThanOrEqual(40_000);
      expect(displayedRequestedTime).toBe(this.requestedTimeDisplayFormatter.format(requestPickupTriggeredAt));
    }

    return pickupNumber;
  }
}
