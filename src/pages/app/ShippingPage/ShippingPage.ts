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
  readonly selectAllCheckbox: Locator;
  readonly requestPickupButton: Locator;
  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);

    // Initialize locators
    // this.ordersButton = this.appFrame.getByRole('button', { name: 'Shipping' });
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
    this.selectAllCheckbox = this.appFrame.getByRole("checkbox", {
      name: "Select all orders",
    });
    this.requestPickupButton = this.appFrame.getByRole("button", {
      name: "Request Pick Up",
    });
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
  async searchOrder(orderID: string, maxRetries: number = 3): Promise<void> {
    await this.searchButton.waitFor({ state: "visible", timeout: 8000 });
    await this.searchButton.click();

    await this.searchInput.waitFor({ state: "visible", timeout: 5000 });

    const cleanOrderID = orderID.replace(/^#/, "");

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.searchInput.clear();
        await this.searchInput.fill(cleanOrderID);
        await this.searchInput.press("Enter");

        await expect(this.ordersTable).toContainText("label generated", {
          timeout: 8000,
        });
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          await this.page.waitForTimeout(2000);
        }
      }
    }

    throw new Error(
      `Order ${orderID} not found in table after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  // Verify order appears in table with label generated status
  async verifyOrderstatusinOrderGrid(): Promise<void> {
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

  async clickOnSelectAllOrders() {
    await expect(this.selectAllCheckbox).toBeVisible({ timeout: 10000 });
    await expect(this.selectAllCheckbox).toBeEnabled({ timeout: 10000 });

    if (!(await this.selectAllCheckbox.isChecked())) {
      await this.selectAllCheckbox.setChecked(true, { force: true });
    }

    await expect(this.selectAllCheckbox).toBeChecked({ timeout: 5000 });
  }

  async selectOrderCheckboxByOrderIdWithLabelGenerated(
    orderID: string,
  ): Promise<void> {
    const normalizedOrderID = orderID.startsWith("#") ? orderID : `#${orderID}`;
    const orderRow = this.ordersTable
      .locator("tr.Polaris-IndexTable__TableRow")
      .filter({
        has: this.appFrame.locator("a.orderId", { hasText: normalizedOrderID }),
      })
      .first();

    await expect(orderRow).toBeVisible({ timeout: 10000 });
    await expect(orderRow).toContainText("label generated", { timeout: 10000 });

    const orderCheckbox = orderRow
      .locator('input[id^="Select-"][type="checkbox"]')
      .first();
    await expect(orderCheckbox).toBeVisible({ timeout: 5000 });
    await expect(orderCheckbox).toBeEnabled({ timeout: 5000 });

    if (!(await orderCheckbox.isChecked())) {
      await orderCheckbox.setChecked(true, { force: true });
    }

    await expect(orderCheckbox).toBeChecked({ timeout: 5000 });
  }

  async selectItemInMoreActionsMenu(menuItem: string): Promise<void> {
    const actionName = `${menuItem}`;
    const normalizedActionName = actionName.trim().replace(/\s+/g, " ");

    await this.openMoreActionsInOrderGrid();

    const menuItems = this.appFrame
      .getByRole("button", { name: normalizedActionName })
      .first();

    await expect(menuItems).toBeEnabled({ timeout: 5000 });
    await menuItems.scrollIntoViewIfNeeded();
    await menuItems.click({ trial: true });
    await menuItems.click();
  }

  async clickOnYesInPopUp(): Promise<void> {
    const confirmYesButton = this.appFrame.getByRole("button", { name: "Yes" });
    await confirmYesButton.waitFor({ state: "visible", timeout: 8000 });
    await confirmYesButton.click();
  }


}
