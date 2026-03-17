import { Page, FrameLocator, Locator, expect, BrowserContext } from '@playwright/test';
import { AppFrameContentLocators, AppFrameHelper } from '../helpers/appFrameHelper';
import axios from 'axios';
// eslint-disable-next-line
const { PDFParse } = require('pdf-parse');
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
  readonly skeletonLoader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);
    this.appContent = new AppFrameContentLocators(this.appFrame);

    // Initialize common locators
    this.appFrameMain = this.appContent.getAppFrameMain();
    this.loadingSpinner = this.appFrame.locator('[class*="spinner"], [class*="loading"]');
    this.appButton = this.page.getByRole('link', { name: 'QA Ship Rate & Track for FedEx' });
    this.skeletonLoader = this.page.locator('.skeleton-loader');
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
    // eslint-disable-next-line no-restricted-syntax
    const link = this.page.locator(`a[href*="/apps/testing-553/${route}"]`);
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click({ force: true });
  }

  successMessage(message: string) {
    return this.page.getByText(message, { exact: true });
  }

  async expectToast(message: string) {
    // eslint-disable-next-line no-restricted-syntax
    const toast = this.appFrame.locator(`text=${message}`).first();
    // await toast.waitFor({ state: 'visible', timeout: 5000 });
    await expect(toast).toBeVisible({ timeout: 7000 });
  }
  calculateVolumetricWeight(
    length: number,
    width: number,
    height: number,
    unit: 'in' | 'cm' | 'ft' | 'mt'
  ) {
    const divisor = unit === 'cm' ? 5000 : 139;
    return Number(((length * width * height) / divisor).toFixed(2));
  }
  async selectShopifyMenuOption(option: string) {
    const menuOption = this.page.getByRole('link', { name: option }).first();
    await menuOption.waitFor({ state: 'visible', timeout: 5000 });
    await menuOption.click();
  }

  async clickButtonByName(buttonName: string) {
    const button = this.page.getByRole('button', { name: buttonName }).first();
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
  }
  async captureDocumentUrl(context: BrowserContext, triggerAction: () => Promise<void>, urlParamName: string = 'document'): Promise<{ documentUrl: string; pdfText: string }> {
    const newPagePromise = context.waitForEvent('page');
    await triggerAction();

    const newPage = await newPagePromise;
    await newPage.waitForLoadState('load');

    const viewerUrl = newPage.url();
    const url = new URL(viewerUrl);
    const documentUrl = url.searchParams.get(urlParamName) ?? '';

    console.log(`✔ Captured document URL: ${documentUrl}`);
    await newPage.close();
    expect(documentUrl).toBeTruthy();

    const response = await axios.get(documentUrl, { responseType: 'arraybuffer' });
    const parser = new PDFParse({ data: response.data });
    const pdfData = await parser.getText();
    console.log(pdfData.text);

    console.log('✔ PDF text extracted successfully');
    console.log(pdfData.text);

    return { documentUrl, pdfText: pdfData.text };
  }
}
