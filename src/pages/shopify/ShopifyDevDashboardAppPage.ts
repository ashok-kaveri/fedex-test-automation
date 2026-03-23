import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyDevDashboardAppPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  readonly appsSection: Locator;
  readonly searchInput: Locator;
  readonly appResultLink: Locator;
  readonly installAppButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= APPS SECTION =================

    this.appsSection = this.page.getByRole('link', { name: 'Apps' });

    // ================= SEARCH =================

    this.searchInput = this.page.locator('input[type="search"]');

    // ================= APP RESULT =================

    this.appResultLink = this.page.getByRole('link');

    // ================= INSTALL =================

    this.installAppButton = this.page.getByRole('link', { name: 'Install app' });
  }

  // ================= DYNAMIC LOCATORS =================

  getAppByName(appName: string): Locator {
    return this.page.getByRole('link', { name: appName });
  }

  // ================= ACTION METHODS =================

  async openAppsSection() {
    await this.appsSection.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchApp(appName: string) {
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.fill(appName);
    await this.page.keyboard.press('Enter');
  }

  async selectApp(appName: string) {
    const app = this.getAppByName(appName);

    await app.waitFor({ state: 'visible' });

    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      app.click(),
    ]);
  }

 
  async clickInstallAndGetStoreSelectionPage(): Promise<Page> {

    const [storeSelectionPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.installAppButton.click()
    ]);

    await storeSelectionPage.waitForLoadState('domcontentloaded');

    return storeSelectionPage;
  }


  async installAppFromDevDashboard(appName: string): Promise<Page> {
    await this.openAppsSection();
    await this.searchApp(appName);
    await this.selectApp(appName);

    return await this.clickInstallAndGetStoreSelectionPage();
  }
}