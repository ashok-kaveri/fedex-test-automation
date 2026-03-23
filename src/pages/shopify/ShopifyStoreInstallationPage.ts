import { Page, Locator, FrameLocator } from '@playwright/test';
import { BasePage } from '../basePage';
import { AppFrameHelper } from '../../helpers/appFrameHelper';

export class ShopifyStoreInstallationPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================


  // Install
  readonly installAppButton: Locator;

  // Approval
  readonly approveButton: Locator;

  // App iframe
  readonly appFrame: FrameLocator;

  // Plan
  readonly selectPlanButton: Locator;



  constructor(page: Page) {
    super(page);
    this.page = page;

    // ================= INSTALL =================

    this.installAppButton = this.page.getByRole('button', { name: /install/i });

    // ================= APPROVE =================

    this.approveButton = this.page.getByRole('button', { name: 'Approve' });

    // ================= APP FRAME =================

    this.appFrame = AppFrameHelper.getAppFrame(this.page);

    // ================= PLAN =================

    this.selectPlanButton = this.appFrame.getByRole('button', { name: 'Select Plan' }).nth(2);

  
  }


  // ================= DYNAMIC LOCATORS =================

  getinstallationVerificationMessage(installationVerificationText: string): Locator
  {
   return  this.appFrame.getByText(installationVerificationText);
  }

  getAppByName(appName: string): Locator {
    return this.page.getByRole('link', { name: appName });
  }

  // ================= ACTION METHODS =================



  async selectApp(appName: string) {
    const app = this.getAppByName(appName);

    await app.waitFor({ state: 'visible' });

    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      app.click(),
    ]);
  }

  async clickInstallApp() {
    await this.installAppButton.waitFor({ state: 'visible' });
    await Promise.all([
      this.installAppButton.click(),
    ]);
  }

  async selectPlan() {
    await this.selectPlanButton.waitFor({ state: 'visible' });
    await Promise.all([
      this.selectPlanButton.click(),
    ]);
  }

  async approveInstallation() {
    await this.approveButton.waitFor({ state: 'visible' });

    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.approveButton.click(),
    ]);
  }
  async installAppToStore() {
    await this.clickInstallApp();
    await this.selectPlan();
    await this.approveInstallation();
  }
  
  
}
