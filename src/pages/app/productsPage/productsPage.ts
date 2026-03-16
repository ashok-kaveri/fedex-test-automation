import { Page, Locator, FrameLocator } from '@playwright/test';
import { BasePage } from '../../basePage';

export class ProductPage extends BasePage {
  readonly appIframe: FrameLocator;
  readonly productSearchAndFilterBtn: Locator;
  readonly productSearchInput: Locator;
  // readonly signatureSelect: Locator;

  constructor(page: Page) {
    super(page);

    this.appIframe = page.frameLocator('iframe[name="app-iframe"]');
    this.productSearchAndFilterBtn = this.appIframe.getByRole('button', { name: 'Search and filter results' });
    this.productSearchInput = this.appIframe.getByPlaceholder('Search by Product Name (Esc to cancel)');
    // this.signatureSelect = this.appIframe.getByLabel('FedEx® Delivery Signature');
  }

  // Search for a product and select it
  async searchAndSelectProduct(productName: string): Promise<void> {
    await this.productSearchAndFilterBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.productSearchAndFilterBtn.click();
    await this.productSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.productSearchInput.fill(productName);
    await this.productSearchInput.press('Enter');

    // Select the searched product from the results
    const searchedProduct = await this.appIframe.getByRole('button', { name: productName, exact: true });
    await searchedProduct.waitFor({ state: 'visible', timeout: 10000 });
    await searchedProduct.click();
  }
}
