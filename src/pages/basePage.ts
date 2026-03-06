import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../helpers/appFrameHelper';

/**
 * BasePage class - Base class for all page objects in the FedEx automation suite
 * Provides common functionality and locators shared across multiple page objects
 */
export class BasePage {
  readonly page: Page;
  readonly appFrame: FrameLocator;
  readonly appContent: AppFrameContentLocators;

  // Common locators
  readonly appFrameMain: Locator;
  readonly loadingSpinner: Locator;
  readonly appButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize common locators
    this.appFrameMain = this.appContent.getAppFrameMain();
    this.loadingSpinner = this.appFrame.locator('[class*="spinner"], [class*="loading"]');
    this.appButton = this.page.getByRole('link', { name: 'QA Ship Rate & Track for FedEx' });
  }

  //Wait for loading spinner to disappear
  async waitForLoadingToComplete() {
    await this.loadingSpinner
      .first()
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {
        // Loading spinner may not appear, continue execution
      });
  }
  // Wait for page to reach a specific state

  async waitForPageLoadState(state: 'domcontentloaded' | 'load' | 'networkidle' = 'load') {
    await this.page.waitForLoadState(state);
  }

  async clickAppButton() {
    await this.appButton.click({ force: true });
  }

  async selectAppMenu(route: string) {
    const link = this.page.locator(`a[href*="/apps/testing-553/${route}"]`);
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click({ force: true });
  }

  successMessage(message: string) {
    return this.appFrame.getByText(message, { exact: true });
  }
}
