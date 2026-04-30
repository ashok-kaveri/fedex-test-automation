import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../basePage';

type FailureDialogDetails = {
  code: string;
  message: string;
  resolution: string;
  rawText: string;
};

type RequestResponsePayload = {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
};

export class LabelFailureValidations extends BasePage {
  readonly shippingGridUrl: string;
  readonly allTab: Locator;
  readonly ordersTable: Locator;
  readonly errorInfoDialog: Locator;
  readonly requestResponseDialog: Locator;
  readonly requestSection: Locator;
  readonly responseSection: Locator;
  readonly viewRequestResponseButton: Locator;
  readonly closeDialogButton: Locator;

  constructor(page: Page) {
    super(page);

    this.shippingGridUrl = `https://admin.shopify.com/store/${process.env.STORE}/apps/testing-553/shopify`;
    this.allTab = this.appFrame.getByRole('tab', { name: 'All' });
    this.ordersTable = this.appFrame.getByRole('table');
    this.errorInfoDialog = this.appFrame.getByRole('dialog').filter({ hasText: 'Error Info' }).first();
    this.requestResponseDialog = this.appFrame.getByRole('dialog').filter({ hasText: 'Request' }).filter({ hasText: 'Response' }).first();
    this.requestSection = this.requestResponseDialog.locator('pre').first();
    this.responseSection = this.requestResponseDialog.locator('pre').nth(1);
    this.viewRequestResponseButton = this.errorInfoDialog.getByRole('button', { name: 'View', exact: true });
    this.closeDialogButton = this.appFrame.getByRole('button', { name: 'Close' }).last();
  }

  getOrderRow(orderName: string): Locator {
    const normalizedOrderName = orderName.startsWith('#') ? orderName : `#${orderName}`;
    return this.appFrame.locator('tbody tr').filter({ hasText: normalizedOrderName }).first();
  }

  async waitForAutoLabelRoute(orderId: string): Promise<void> {
    await this.page.waitForURL(url => url.toString().includes(`/api/v1/labels/auto?id=${orderId}`), {
      timeout: 60000,
    });
  }

  async openShippingGrid(): Promise<void> {
    await this.page.goto(this.shippingGridUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await this.allTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.ordersTable.waitFor({ state: 'visible', timeout: 20000 });
  }

  async hardRefreshShippingGrid(): Promise<void> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.goto(this.shippingGridUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await this.page.waitForTimeout(4000);

      const allTabVisible = await this.allTab.isVisible().catch(() => false);
      const tableVisible = await this.ordersTable.isVisible().catch(() => false);

      if (allTabVisible && tableVisible) {
        return;
      }
    }

    await this.allTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.ordersTable.waitFor({ state: 'visible', timeout: 20000 });
  }

  async waitForOrderToAppear(orderName: string, maxRetries: number = 12): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const row = this.getOrderRow(orderName);
      if (await row.isVisible().catch(() => false)) {
        return;
      }

      await this.hardRefreshShippingGrid();
    }

    throw new Error(`Order ${orderName} did not appear in the shipping grid after ${maxRetries} hard refresh attempts`);
  }

  async waitForOrderToReachFinalState(orderName: string, maxRetries: number = 12): Promise<string> {
    await this.waitForOrderToAppear(orderName);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const row = this.getOrderRow(orderName);
      const rowText = ((await row.textContent()) || '').toLowerCase();

      if (rowText.includes('failed')) {
        return rowText;
      }

      await this.hardRefreshShippingGrid();
    }

    throw new Error(`Order ${orderName} did not move to failed state after ${maxRetries} hard refresh attempts`);
  }

  async openOrderFailureMessage(orderName: string): Promise<void> {
    const row = this.getOrderRow(orderName);
    await row.waitFor({ state: 'visible', timeout: 15000 });

    //City name is too short. Please prov...
    const messageButton = row.getByRole('button').filter({ hasText: 'City name is too short. Please prov...' }).first();
    await messageButton.waitFor({ state: 'visible', timeout: 10000 });
    await messageButton.click();
    await this.errorInfoDialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getFailureDialogDetails(): Promise<FailureDialogDetails> {
    await this.errorInfoDialog.waitFor({ state: 'visible', timeout: 10000 });
    const dialogText = await this.errorInfoDialog.innerText();

    const codeMatch = dialogText.match(/FedEx Error Code\s+([A-Z._]+)/i);
    const messageMatch = dialogText.match(/Error Message\s+([\s\S]*?)\s+Resolution/i);
    const resolutionMatch = dialogText.match(/Resolution\s+([\s\S]*?)\s+Request\/Response XMLs/i);

    return {
      code: codeMatch?.[1]?.trim() || '',
      message: messageMatch?.[1]?.trim() || '',
      resolution: resolutionMatch?.[1]?.trim() || '',
      rawText: dialogText,
    };
  }

  async openRequestResponseXmlView(): Promise<void> {
    await this.errorInfoDialog.waitFor({ state: 'visible', timeout: 10000 });
    await this.viewRequestResponseButton.click();
    await this.requestResponseDialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getRequestResponsePayload(): Promise<RequestResponsePayload> {
    await this.requestResponseDialog.waitFor({ state: 'visible', timeout: 10000 });

    const requestText = (await this.requestSection.innerText()).trim();
    const responseText = (await this.responseSection.innerText()).trim();

    return {
      request: JSON.parse(requestText),
      response: JSON.parse(responseText),
    };
  }

  async closeActiveDialog(): Promise<void> {
    const dialog = (await this.requestResponseDialog.isVisible().catch(() => false))
      ? this.requestResponseDialog
      : this.errorInfoDialog;

    await this.closeDialogButton.click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  }
}
