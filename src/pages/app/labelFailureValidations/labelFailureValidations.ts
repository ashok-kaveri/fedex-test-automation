import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../basePage';
import type { ShopifyAdminPage } from '../../shopify/ShopifyAdminPage';

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
  readonly refreshButton: Locator;
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
    this.refreshButton = this.appFrame.getByRole('button', { name: 'Refresh' });
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

  async refreshShippingGridIfAvailable(): Promise<void> {
    if (await this.refreshButton.isVisible().catch(() => false)) {
      await this.refreshButton.click();
    }
    await this.page.waitForTimeout(3000);
  }

  async waitForOrderToAppear(orderName: string, maxRetries: number = 12): Promise<void> {
    await this.allTab.waitFor({ state: 'visible', timeout: 20000 });
    await this.ordersTable.waitFor({ state: 'visible', timeout: 20000 });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const row = this.getOrderRow(orderName);
      if (await row.isVisible().catch(() => false)) {
        return;
      }

      await this.refreshShippingGridIfAvailable();
    }

    throw new Error(`Order ${orderName} did not appear in the shipping grid after ${maxRetries} polling attempts`);
  }

  async waitForOrderToReachFinalState(orderName: string, maxRetries: number = 12): Promise<string> {
    await this.waitForOrderToAppear(orderName);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const row = this.getOrderRow(orderName);
      const rowText = ((await row.textContent()) || '').toLowerCase();

      if (rowText.includes('failed')) {
        return rowText;
      }

      await this.refreshShippingGridIfAvailable();
    }

    throw new Error(`Order ${orderName} did not move to failed state after ${maxRetries} polling attempts`);
  }

  async waitForOrderToReachStatus(orderName: string, expectedStatus: string, maxRetries: number = 12): Promise<string> {
    await this.waitForOrderToAppear(orderName, maxRetries);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const row = this.getOrderRow(orderName);
      const rowText = ((await row.textContent()) || '').toLowerCase();

      if (rowText.includes(expectedStatus.toLowerCase())) {
        return rowText;
      }

      await this.refreshShippingGridIfAvailable();
    }

    throw new Error(`Order ${orderName} did not move to ${expectedStatus} state after ${maxRetries} polling attempts`);
  }

  async triggerAutoGenerateLabelUntilFailed(
    shopifyAdmin: ShopifyAdminPage,
    storeName: string,
    orderName: string,
    options: { maxAttempts?: number; statePollRetries?: number } = {},
  ): Promise<void> {
    const maxAttempts = options.maxAttempts ?? 3;
    const statePollRetries = options.statePollRetries ?? 10;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt === 1) {
          await shopifyAdmin.navigateToStore(storeName);
          await shopifyAdmin.searchAndOpenOrder(orderName, 5);
        } else {
          await shopifyAdmin.navigateToOrdersList(storeName);
          await shopifyAdmin.openOrderFromOrdersList(orderName, 5);
        }

        await shopifyAdmin.openMoreActions();
        await shopifyAdmin.clickOnAutoLabelGeneration();
        await this.openShippingGrid();
        await this.waitForOrderToReachFinalState(orderName, statePollRetries);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxAttempts) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error(`Failed to auto-generate label for ${orderName}`);
  }

  async triggerAutoGenerateLabelUntilStatus(
    shopifyAdmin: ShopifyAdminPage,
    storeName: string,
    orderName: string,
    expectedStatus: string,
    options: { maxAttempts?: number; statePollRetries?: number } = {},
  ): Promise<void> {
    const maxAttempts = options.maxAttempts ?? 3;
    const statePollRetries = options.statePollRetries ?? 10;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt === 1) {
          await shopifyAdmin.navigateToStore(storeName);
          await shopifyAdmin.searchAndOpenOrder(orderName, 5);
        } else {
          await shopifyAdmin.navigateToOrdersList(storeName);
          await shopifyAdmin.openOrderFromOrdersList(orderName, 5);
        }

        await shopifyAdmin.openMoreActions();
        await shopifyAdmin.clickOnAutoLabelGeneration();
        await this.openShippingGrid();
        await this.waitForOrderToReachStatus(orderName, expectedStatus, statePollRetries);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxAttempts) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error(`Failed to auto-generate label for ${orderName}`);
  }

  async verifyShortCityAutoLabelFailure(
    shopifyAdmin: ShopifyAdminPage,
    storeName: string,
    orderName: string,
    city: string,
  ): Promise<void> {
    await this.triggerAutoGenerateLabelUntilFailed(shopifyAdmin, storeName, orderName);

    await this.openOrderFailureMessage(orderName);
    const failureInfo = await this.getFailureDialogDetails();

    expect(failureInfo.code).toBe('CITY.TOO.SHORT');
    expect(failureInfo.message).toContain('City name is too short. Please provide the full city name.');
    expect(failureInfo.resolution).toContain('support@pluginhive.com');

    await this.openRequestResponseXmlView();
    const { request, response } = await this.getRequestResponsePayload();

    const requestedShipment = (request.requestObject as Record<string, unknown>)?.requestedShipment as Record<string, unknown>;
    const recipients = requestedShipment?.recipients as Array<Record<string, unknown>> | undefined;
    const address =
      (recipients?.[0]?.address as Record<string, unknown> | undefined) ??
      ((requestedShipment?.recipient as Record<string, unknown> | undefined)?.address as Record<string, unknown> | undefined);
    const responsePayload = response.jsonResponse as Record<string, unknown>;
    const errors = responsePayload?.errors as Array<Record<string, unknown>>;

    expect(address?.city).toBe(city);
    expect(address?.postalCode).toBe('GU21 2MY');
    expect(address?.countryCode).toBe('GB');
    expect(response.status).toBe(400);
    expect(errors?.[0]?.code).toBe('CITY.TOO.SHORT');
  }

  async verifyValidCityAutoLabelSuccess(
    shopifyAdmin: ShopifyAdminPage,
    storeName: string,
    orderName: string,
  ): Promise<void> {
    await this.triggerAutoGenerateLabelUntilStatus(
      shopifyAdmin,
      storeName,
      orderName,
      'label generated',
    );

    await this.openShippingGrid();
    const rowText = await this.waitForOrderToReachStatus(orderName, 'label generated', 10);

    expect(rowText).toContain('label generated');
    expect(rowText).not.toContain('failed');
  }

  async openOrderFailureMessage(orderName: string): Promise<void> {
    const row = this.getOrderRow(orderName);
    await row.waitFor({ state: 'visible', timeout: 15000 });

    //City name is too short. Please prov...
    const messageButton = row.getByRole('button').filter({ hasText: 'City name is too short. Please prov...' }).first();
    await messageButton.waitFor({ state: 'visible', timeout: 10000 });
    await messageButton.click();
    await this.errorInfoDialog.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.errorInfoDialog).toContainText('FedEx Error Code', { timeout: 15000 });
  }

  async getFailureDialogDetails(): Promise<FailureDialogDetails> {
    await this.errorInfoDialog.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.errorInfoDialog).toContainText('FedEx Error Code', { timeout: 15000 });
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
