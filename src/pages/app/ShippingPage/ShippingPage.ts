import { Page, FrameLocator, Locator, expect } from "@playwright/test";
import { AppFrameHelper } from "../../../helpers/appFrameHelper";

// Page Object for Shipping Page within FedEx App - Handles all actions related to viewing and searching orders
export class ShippingPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;

  // Locators
  readonly ordersButton: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly ordersTable: Locator;
  readonly moreActionsButton: Locator;
  readonly selectAllCell: Locator;
  readonly headers: Locator;

  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);

    // Initialize locators

    this.ordersButton = this.appFrame.getByText("Shipping");
    this.searchButton = this.appFrame.getByRole("button", {
      name: "Search and filter results",
    });
    this.searchInput = this.appFrame.getByRole("textbox", {
      name: /Search by order id/,
    });
    this.ordersTable = this.appFrame.getByRole("table");
    this.moreActionsButton = this.appFrame
      .getByRole("button", { name: "More actions" })
      .first();
    this.selectAllCell = this.appFrame.getByRole("cell", {
      name: "Select all orders",
    });

    this.refreshButton = this.appFrame.locator('button:has-text("Refresh")');

    this.headers = this.appFrame.locator("table thead th");
  }

  // Helper method for dynamic locators
  getOrderRow(orderID: string): Locator {
    return this.ordersTable.getByText(orderID);
  }

  // Navigate to Orders page
  async navigateToOrdersPage(): Promise<void> {
    await this.ordersButton.waitFor({ state: "visible", timeout: 5000 });
    await this.ordersButton.click();
  }

  // Search for order by ID
  async searchOrder(orderID: string): Promise<void> {
    const cleanOrderID = orderID.replace(/^#/, "");
    await this.searchButton.waitFor({ state: "visible", timeout: 10000 });
    await this.searchButton.click();
    await this.searchInput.waitFor({ state: "visible", timeout: 10000 });
    await this.searchInput.fill(cleanOrderID);
    await this.searchInput.press("Enter");
    // Wait until row appears
    await this.getRowByOrderId(`#${cleanOrderID}`).waitFor({
      state: "visible",
      timeout: 10000,
    });
  }

  // Get row by order ID
  getRowByOrderId(orderID: string) {
    const cleanOrderID = orderID.replace(/^#/, "");
    return this.appFrame
      .locator("tbody tr:visible")
      .filter({ hasText: `#${cleanOrderID}` })
      .first();
  }

  // Helper method to get column index
  async getColumnIndex(columnName: string): Promise<number> {
    const key = columnName.toLowerCase();

    await this.headers.first().waitFor({ state: "visible", timeout: 15000 });

    const count = await this.headers.count();

    for (let i = 0; i < count; i++) {
      const text = (await this.headers.nth(i).innerText()).trim().toLowerCase();

      if (text.includes(key)) {
        return i;
      }
    }
    throw new Error(`Column "${columnName}" not found`);
  }
  // Helper method to get cell value
  async getCellValue(orderID: string, columnName: string): Promise<string> {
    const row = this.getRowByOrderId(orderID);
    const columnIndex = await this.getColumnIndex(columnName);

    const cell = row.locator("td").nth(columnIndex);
    const value = await cell.textContent();

    return value?.trim() || "";
  }

  // Helper method to click refresh button
  async clickRefreshIfVisible(): Promise<boolean> {
    if (await this.refreshButton.isVisible().catch(() => false)) {
      await this.refreshButton.click();
      return true;
    }

    return false;
  }

  // Verify order appears in table with label generated status

  async orderGridColumnValidation(
    orderID: string,
    columnName: string,
    expectedValue: string,
    maxRetries: number = 10,
  ): Promise<void> {
    const expected = expectedValue.toLowerCase();

    // Step 1: Capture initial value
    const initialRaw = await this.getCellValue(orderID, columnName);
    const initialValue = initialRaw.toLowerCase().replace(/\s+/g, " ").trim();

    console.log(`Initial ${columnName}: ${initialValue}`);

    let lastValue = initialValue;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}`);

      // Refresh if toast visible
      const refreshed = await this.clickRefreshIfVisible();
      if (refreshed) {
        // await this.page.waitForLoadState("load");
        await this.page.waitForTimeout(1000);
      }

      const rawValue = await this.getCellValue(orderID, columnName);
      const currentValue = rawValue.toLowerCase().replace(/\s+/g, " ").trim();

      console.log(`${columnName}: ${currentValue}`);

      // PASS
      if (currentValue.includes(expected)) {
        console.log(
          `Order ${orderID} ${columnName} matched expected value: ${expectedValue}`,
        );
        return;
      }

      // EARLY FAIL:
      // Value changed from initial but not expected
      if (currentValue !== initialValue && !currentValue.includes(expected)) {
        throw new Error(
          `Order ${orderID} ${columnName} changed to unexpected value.\n` +
            `Expected: ${expectedValue}\n` +
            `Actual: ${currentValue}`,
        );
      }

      lastValue = currentValue;

      await this.page.waitForTimeout(1000);
    }

    // Timeout case
    throw new Error(
      `Validation timeout for Order ${orderID}\n` +
        `Column: ${columnName}\n` +
        `Expected: ${expectedValue}\n` +
        `Last Observed: ${lastValue}`,
    );
  }

  async verifyOrderStatusInOrderGrid(): Promise<void> {
    await expect(this.ordersTable).toContainText("label generated", {
      timeout: 10000,
    });
  }

  // Select all orders in the table
  async selectAllOrdersInOrderGrid(): Promise<void> {
    await this.selectAllCell.waitFor({ state: "visible", timeout: 5000 });
    await this.selectAllCell.click();
  }

  // Open more actions menu
  async openMoreActionsInOrderGrid(): Promise<void> {
    await this.moreActionsButton.waitFor({ state: "visible", timeout: 5000 });
    await this.moreActionsButton.click();
  }
}
