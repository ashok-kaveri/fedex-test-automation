import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Shipping Page within FedEx App
export class ShippingPage extends BasePage {
  private lastRequestPickupTriggeredAt: Date | null;

  // Locators
  readonly ordersButton: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly ordersTable: Locator;
  readonly moreActionsButton: Locator;
  readonly selectAllCell: Locator;
  readonly selectAllCheckbox: Locator;
  readonly requestPickupButton: Locator;
  readonly headers: Locator;
  readonly refreshButton: Locator;
  readonly clickOrderNumber: Locator;
  readonly returnFailureTitleForUnfulfilledOrder: Locator;
  readonly returnFailureDescriptionForUnfulfilledOrder: Locator;
  // readonly productsTab: Locator;

  readonly yesBtnInPopUpForRequestPickup: Locator;

  constructor(page: Page) {
    super(page);
    this.lastRequestPickupTriggeredAt = null;

    // Initialize locators
    this.ordersButton = this.appFrame.getByText('Shipping');
    this.searchButton = this.appFrame.getByRole('button', { name: 'Search and filter results' });
    this.searchInput = this.appFrame.getByRole('textbox', { name: /Search by order id/ });
    this.ordersTable = this.appFrame.getByRole('table');
    this.moreActionsButton = this.appFrame.getByRole('button', { name: 'More actions' }).first();
    this.selectAllCell = this.appFrame.getByRole('cell', { name: 'Select all orders' });
    this.selectAllCheckbox = this.appFrame.getByRole('checkbox', { name: 'Select all orders' });
    this.requestPickupButton = this.appFrame.getByRole('button', { name: 'Request Pick Up' });
    this.clickOrderNumber = this.appFrame.locator('a[class="orderId"]');
    this.returnFailureTitleForUnfulfilledOrder = this.appFrame.getByText('Failed to generate Return Label');
    this.returnFailureDescriptionForUnfulfilledOrder = this.appFrame.getByText('Sorry, you cannot generate a return label for this order because it is not yet fulfilled. Please wait until the order is fulfilled to proceed or select a fulfilled order.');
    // this.productsTab = page.getByRole('link', { name: 'Products' }).nth(1);

    // From second file
    this.refreshButton = this.appFrame.locator('button:has-text("Refresh")');
    this.headers = this.appFrame.locator('table thead th');
    this.yesBtnInPopUpForRequestPickup = this.appFrame.getByRole('button', { name: 'Yes' });
  }

  getOrderRow(orderID: string): Locator {
    return this.ordersTable.getByText(orderID);
  }

  async navigateToOrdersPage(): Promise<void> {
    await this.ordersButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.ordersButton.click();
  }

  async searchOrder(orderID: string, maxRetries: number = 3): Promise<void> {
    const cleanOrderID = orderID.replace(/^#/, '');

    await this.searchButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchButton.click();
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.searchInput.clear();
        await this.searchInput.fill(cleanOrderID);
        await this.searchInput.press('Enter');

        await expect(this.ordersTable).toContainText('label generated', { timeout: 8000 });
        return;
      } catch (e) {
        lastError = e as Error;
        await this.page.waitForTimeout(2000);
      }
    }

    throw new Error(`Order ${orderID} not found: ${lastError?.message}`);
  }

  getRowByOrderId(orderID: string) {
    const clean = orderID.replace(/^#/, '');
    return this.appFrame
      .locator('tbody tr:visible')
      .filter({ hasText: `#${clean}` })
      .first();
  }

  async getColumnIndex(columnName: string): Promise<number> {
    const key = columnName.toLowerCase();
    await this.headers.first().waitFor({ state: 'visible', timeout: 15000 });

    const count = await this.headers.count();
    for (let i = 0; i < count; i++) {
      const text = (await this.headers.nth(i).innerText()).trim().toLowerCase();
      if (text.includes(key)) return i;
    }

    throw new Error(`Column "${columnName}" not found`);
  }

  async getCellValue(orderID: string, columnName: string): Promise<string> {
    const row = this.getRowByOrderId(orderID);
    const index = await this.getColumnIndex(columnName);
    const cell = row.locator('td').nth(index);
    return (await cell.textContent())?.trim() || '';
  }

  async clickRefreshIfVisible(): Promise<boolean> {
    if (await this.refreshButton.isVisible().catch(() => false)) {
      await this.refreshButton.click();
      return true;
    }
    return false;
  }

  async verifyOrderStatusInOrderGrid(): Promise<void> {
    await expect(this.ordersTable).toContainText('label generated', { timeout: 10000 });
  }

  async orderGridColumnValidation(orderID: string, columnName: string, expectedValue: string, maxRetries = 10) {
    const expected = expectedValue.toLowerCase();
    const initial = (await this.getCellValue(orderID, columnName)).toLowerCase().trim();
    let lastValue = initial;

    for (let i = 1; i <= maxRetries; i++) {
      await this.clickRefreshIfVisible();
      await this.page.waitForTimeout(1000);

      const current = (await this.getCellValue(orderID, columnName)).toLowerCase().trim();

      if (current.includes(expected)) return;

      if (current !== initial && !current.includes(expected)) {
        throw new Error(`Unexpected value change: ${current}`);
      }

      lastValue = current;
    }

    throw new Error(`Timeout. Last value: ${lastValue}`);
  }

  async selectAllOrdersInOrderGrid() {
    await this.selectAllCell.waitFor({ state: 'visible', timeout: 5000 });
    await this.selectAllCell.click();
  }

  async clickOnSelectAllOrders() {
    await expect(this.selectAllCheckbox).toBeVisible();
    if (!(await this.selectAllCheckbox.isChecked())) {
      await this.selectAllCheckbox.setChecked(true, { force: true });
    }
  }

  async selectOrderCheckboxByOrderIdWithLabelGenerated(orderID: string) {
    const normalized = orderID.startsWith('#') ? orderID : `#${orderID}`;
    const row = this.ordersTable.locator('tr.Polaris-IndexTable__TableRow').filter({
      has: this.appFrame.locator('a.orderId', { hasText: normalized }),
    });
    const checkbox = row.locator('input[id^="Select-"][type="checkbox"]').first();
    await checkbox.setChecked(true, { force: true });
  }

  async openMoreActionsInOrderGrid() {
    await this.moreActionsButton.waitFor({ state: 'visible' });
    await this.moreActionsButton.click();
  }

  async clickMoreActionsItem(actionName: string): Promise<void> {
    const normalizedActionName = actionName.trim().replace(/\s+/g, ' ');
    const isRequestPickupAction = normalizedActionName.toLowerCase() === 'request pick up';
    const candidates: Locator[] = [
      this.appFrame.getByRole('menuitem', { name: normalizedActionName }).first(),
      this.appFrame.locator('.Polaris-ActionList button').filter({ hasText: normalizedActionName }).first(),
      this.appFrame.getByRole('button', { name: normalizedActionName }).first(),
      this.appFrame.locator('button').filter({ hasText: normalizedActionName }).first(),
    ];
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.openMoreActionsInOrderGrid();

        for (const candidate of candidates) {
          if ((await candidate.count()) === 0) continue;
          if (!(await candidate.isVisible())) continue;
          await expect(candidate).toBeEnabled({ timeout: 5000 });
          await candidate.scrollIntoViewIfNeeded();
          await candidate.click({ trial: true });
          await candidate.click();
          if (isRequestPickupAction) {
            const confirmYesButton = this.appFrame.getByRole('button', { name: 'Yes' }).first();
            try {
              await confirmYesButton.waitFor({
                state: 'visible',
                timeout: 2500,
              });
            } catch {
              continue;
            }
          }
          return;
        }
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw lastError ?? new Error(`Failed to click action: ${actionName}`);
  }

  async clickOnYesInPopUp() {
    await this.yesBtnInPopUpForRequestPickup.waitFor({ state: 'visible' });
    this.lastRequestPickupTriggeredAt = new Date();
    await this.yesBtnInPopUpForRequestPickup.click();
  }

  getLastRequestPickupTriggeredAt() {
    return this.lastRequestPickupTriggeredAt;
  }


  // ================= click order Number =================

  async orderClick() {
    // Using 'load' instead of 'networkidle' is much faster and usually sufficient
    await this.page.waitForLoadState('load');
    await this.clickOrderNumber.first().waitFor({ state: 'visible', timeout: 30000 });
    await this.clickOrderNumber.first().click();
  }
  // =================Validating the Return failure message for the unfulfilled order =================
  async validateReturnFailureMessageForUnfulfilledOrder() {
    // await expect(this.returnFailureTitleForUnfulfilledOrder).toBeVisible({ timeout: 10000 });
    // await expect(this.returnFailureDescriptionForUnfulfilledOrder).toBeVisible({ timeout: 10000 });

    return {
    title: this.returnFailureTitleForUnfulfilledOrder,
    description: this.returnFailureDescriptionForUnfulfilledOrder
  };
  }

  // ================= Navigate to Products tab =================
  async navigateToProductsPage(): Promise<void> {
    await this.page.goto(`https://admin.shopify.com/store/${process.env.STORE}/apps/testing-553/products`);
  }


}
