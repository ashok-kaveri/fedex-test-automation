import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyAdminPage extends BasePage {
  // Locators
  readonly searchButton: Locator;
  readonly searchContainer: Locator;
  readonly ordersButton: Locator;
  readonly ordersNavLink: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly moreActionsButton: Locator;
  readonly generateLabelLink: Locator;
  readonly autoGenerateLabel: Locator;
  readonly autoGenerateLabelByHref: Locator;
  readonly markAsFulfilledButton: Locator;
  readonly fulfillmentStatusBadge: Locator;
  readonly generateReturnLabelLink: Locator;
  readonly appsButton: Locator;



  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.searchContainer = page.locator('#search-container');
    this.ordersButton = this.searchContainer.getByRole('button', { name: 'Orders' });
    this.ordersNavLink = page.getByRole('link', { name: /^Orders\b/i }).first();
    this.searchInput = page.getByRole('combobox', { name: 'Search' });
    this.searchResults = page.locator('ul#search-results');
    this.moreActionsButton = page.getByRole('button', { name: 'More actions' }).first();
    this.generateLabelLink = page.getByRole('link', { name: 'Generate Label', exact: true });
    this.autoGenerateLabel = page.getByRole('link', { name: 'Auto-Generate Label', exact: true });
    this.autoGenerateLabelByHref = page.locator('a[href*="/api/v1/labels/auto?id="]').first();
    this.markAsFulfilledButton = page.getByRole('button', { name: 'Mark as fulfilled' });
    // this.fulfillmentStatusBadge = page.locator('s-internal-badge:nth-child(4) > .badge');
    this.fulfillmentStatusBadge = page.getByText('CompletePaidCompleteFulfilledArchived');
    this.generateReturnLabelLink = page.getByRole('link', { name: 'Generate Return Label', exact: true });
    this.appsButton = page.getByRole('button', { name: 'Apps' });
  
  }

  // Helper method for dynamic locators
  getOrderLink(orderID: string): Locator {
    return this.searchResults.locator(`a[role="option"][href*="/orders/"]`, { hasText: orderID });
  }

  getOrderLinkFromOrdersPage(orderID: string): Locator {
    return this.page.getByRole('link', { name: orderID, exact: true }).first();
  }
  
  getAppLink(appName: string): Locator {  
    return this. page.getByRole('option', { name: appName}).nth(0);

  }

  // Navigate to Shopify admin store
  async navigateToStore(storeName: string): Promise<void> {
    await this.page.goto(`https://admin.shopify.com/store/${storeName}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.searchButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  async navigateToOrdersList(storeName: string): Promise<void> {
    await this.page.goto(`https://admin.shopify.com/store/${storeName}/orders`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.ordersNavLink.waitFor({ state: 'visible', timeout: 30000 });
  }

  // Search and open order by ID with retry logic
  async searchAndOpenOrder(orderID: string, maxRetries: number = 4): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.searchButton.click();
    await this.ordersButton.click();
    await this.searchInput.fill(orderID);

    // Wait for search results with retry logic
    const orderLink = this.getOrderLink(orderID);

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await orderLink.waitFor({ state: 'visible', timeout: 1000 });
        await orderLink.click();
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          // Clear and refill search
          await this.searchInput.clear();
          await this.page.waitForTimeout(1000);
          await this.searchInput.fill(orderID);
          await this.page.waitForTimeout(2000);
        }
      }
    }

    throw new Error(`Order ${orderID} not found after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async openOrderFromOrdersList(orderID: string, maxRetries: number = 5): Promise<void> {
    const orderLink = this.getOrderLinkFromOrdersPage(orderID);
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await orderLink.waitFor({ state: 'visible', timeout: 5000 });
        await orderLink.click();
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
          await this.page.waitForTimeout(3000);
        }
      }
    }

    throw new Error(`Order ${orderID} not found on Orders page after ${maxRetries} attempts: ${lastError?.message}`);
  }

  //Return the Order fuflilment status
  async isOrderFulfilled(): Promise<string> {
  const badge = this.page
    .locator('s-internal-badge')
    .filter({ hasText: /(Fulfilled|Unfulfilled|Partially fulfilled)/i })
    .first();

  return (await badge.innerText()).trim();
}

  // Open more actions menu
  async openMoreActions(): Promise<void> {
    await this.page.waitForURL(/\/orders\/\d+/, { timeout: 30000 });
    await this.page.waitForLoadState('domcontentloaded');
    console.log('[auto-label] order page ready:', this.page.url());
    await this.moreActionsButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.moreActionsButton.waitFor({ state: 'attached', timeout: 10000 });
    await this.moreActionsButton.click();
    console.log('[auto-label] clicked More actions');
    await this.autoGenerateLabel.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    console.log('[auto-label] menu visible:', await this.autoGenerateLabel.isVisible().catch(() => false));
  }

  // Click on Generate Label link to open manual label generation page
  async clickGenerateLabelLink(): Promise<void> {
    await this.generateLabelLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.generateLabelLink.click();
  }

  //Click on Auto-label generation

  async clickOnAutoLabelGeneration(): Promise<void> {
    let lastError: Error | undefined;
    const candidates: Locator[] = [this.autoGenerateLabel, this.autoGenerateLabelByHref];

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (attempt > 1) {
          await this.openMoreActions();
        }

        for (const candidate of candidates) {
          if ((await candidate.count()) === 0) continue;

          const beforeUrl = this.page.url();
          console.log(`[auto-label] attempt ${attempt} candidate start:`, beforeUrl);
          await expect(candidate).toBeVisible({ timeout: 10000 });
          await expect(candidate).toBeEnabled({ timeout: 10000 });
          await candidate.scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(1000);
          await candidate.click({ trial: true });
          console.log(`[auto-label] attempt ${attempt} candidate passed trial click`);
          await candidate.click();
          console.log(`[auto-label] attempt ${attempt} candidate clicked`);

          const handoffConfirmed = await this.waitForAutoGenerateHandoff({ timeoutMs: 8000 }).then(() => true).catch(() => false);
          console.log(`[auto-label] attempt ${attempt} handoff confirmed:`, handoffConfirmed, 'current url:', this.page.url());
          if (handoffConfirmed) {
            await this.page.waitForTimeout(2000);
            return;
          }

          const afterUrl = this.page.url();
          const menuStillVisible = await candidate.isVisible().catch(() => false);
          console.log(`[auto-label] attempt ${attempt} after click url:`, afterUrl, 'menuStillVisible:', menuStillVisible);

          if (afterUrl !== beforeUrl || !menuStillVisible) {
            await this.waitForAutoGenerateHandoff();
            await this.page.waitForTimeout(2000);
            return;
          }
        }

        await expect(this.autoGenerateLabelByHref).toBeVisible({ timeout: 5000 });
        await this.autoGenerateLabelByHref.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(1000);
        console.log(`[auto-label] attempt ${attempt} forcing href fallback click`);
        await this.autoGenerateLabelByHref.click({ force: true });
        await this.waitForAutoGenerateHandoff();
        await this.page.waitForTimeout(2000);
        return;
      } catch (error) {
        lastError = error as Error;
        console.log(`[auto-label] attempt ${attempt} failed:`, lastError.message);
      }
    }

    throw lastError ?? new Error('Failed to trigger Auto-Generate Label');
  }

  async waitForAutoGenerateHandoff(options: { timeoutMs?: number } = {}): Promise<void> {
    const timeoutMs = options.timeoutMs ?? 10000;
    await this.page.waitForURL(url => !/\/orders\/\d+/.test(url.toString()), { timeout: timeoutMs });
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForURL(
      url => {
        const current = url.toString();
        return current.includes('/apps/testing-553/api/v1/labels/auto?id=') || current.includes('/apps/testing-553/shopify');
      },
      { timeout: timeoutMs },
    );
    await this.page.frameLocator('iframe[name="app-iframe"]').locator('body').waitFor({ state: 'attached', timeout: timeoutMs });
  }

  //Click on Generate Return Label
  async clickOnGenerateReturnLabel(): Promise<void> {
    await this.generateReturnLabelLink.click();
  }
// Click Apps button
  async openAppsSection(): Promise<void> {
  await this.appsButton.click();
}
//Search for the app
async searchApp(appName: string): Promise<void> {
  await this.searchInput.fill(appName);
  await this.page.keyboard.press('Enter');
}
//Click the app from search results

async clickAppFromResults(appName: string): Promise<void> {
  const appLink = this.getAppLink(appName);

  await appLink.waitFor({ state: 'visible', timeout: 20000 });

  await Promise.all([
    this.page.waitForLoadState('networkidle'),
    appLink.click()
  ]);
}

  // fulfilling order from Shopify Order Summary page
  async confirmOrderFulfillment(): Promise<string> {
    await this.markAsFulfilledButton.click();
    await this.markAsFulfilledButton.click();
    await this.fulfillmentStatusBadge.waitFor({ state: 'visible', timeout: 20000 });
    return await this.fulfillmentStatusBadge.innerText();
  }

  //generic method to navigate to order and click on generate label manually in shopify admin
  async navigateToOrderInShopifyAndClickGenerateLabel(orderID: string): Promise<void> {
    await this.navigateToStore(process.env.STORE!);
    await this.searchAndOpenOrder(orderID, 5);
    await this.openMoreActions();
    await this.clickGenerateLabelLink();
  }

async clickGenerateReturnLabelLink(): Promise<void> {
    await this.generateReturnLabelLink.click();
  }
//Method to generate return label from Shopify Order summary page for a fulfilled order
  async navigateToOrderInShopifyAndCheckStatus(orderID: string): Promise<void> {
  await this.navigateToStore(process.env.STORE!);
  await this.searchAndOpenOrder(orderID, 5);

  const status = await this.isOrderFulfilled();
  console.log('Status:', status);

  if (!status.toLowerCase().includes('fulfilled')) {
    throw new Error(`Order not fulfilled → ${status}`);
  }
  await this.openMoreActions();
  await this.clickGenerateReturnLabelLink();
  }

  async fulfillOrderInShopify(orderID: string): Promise<string> {
    await this.navigateToStore(process.env.STORE!);
    await this.searchAndOpenOrder(orderID, 5);
    const status = await this.confirmOrderFulfillment();
    await this.openMoreActions();
    await this.clickOnGenerateReturnLabel();
    return status;
  }

  
  async navigateToApp(appName: string): Promise<string> {
  console.log(`Navigating to app "${appName}" in Shopify Admin...`);
  await this.openAppsSection();
  await this.searchApp(appName);
  await this.clickAppFromResults(appName);
  await this.page.waitForLoadState('networkidle');
  return this.page.url();
}
}
