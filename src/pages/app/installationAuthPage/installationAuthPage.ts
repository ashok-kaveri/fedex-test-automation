import { Page, Locator } from '@playwright/test';

export class InstallationAuthPage {

  readonly page: Page;
  readonly authorizeButton: Locator;
  readonly selectPlanButton: Locator;
  readonly approveButton: Locator;
  readonly thankYouMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.authorizeButton = page.locator('#authorizationButton');
    this.selectPlanButton = page.getByRole('button', { name: /select.*plan/i });
    this.approveButton = page.getByRole('button', { name: /approve/i });
    this.thankYouMessage = page.locator('text=Thank you');
  }

  async authorizeAndVerify() {

    if (await this.authorizeButton.count() > 0 && await this.authorizeButton.isVisible()) {

      console.log('Authorize button found. Starting authorization flow...');

      const [authPage] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.authorizeButton.click()
      ]);

      await authPage.waitForLoadState();

      const selectPlanButton = authPage.getByRole('button', { name: /select.*plan/i });
      const approveButton = authPage.getByRole('button', { name: /approve/i });

      await selectPlanButton.click();

      await Promise.all([
        authPage.waitForLoadState('networkidle'),
        approveButton.click()
      ]);

      await this.verifyThankYouPage();

    } else {

      console.log('Authorize button not present. Verifying Thank You page directly...');

      await this.verifyThankYouPage();
    }
  }

  async verifyThankYouPage() {
    await this.thankYouMessage.waitFor({ state: 'visible', timeout: 30000 });
  }
}