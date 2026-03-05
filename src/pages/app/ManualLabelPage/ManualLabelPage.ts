import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { BasePage } from '../../basePage';

// Page Object for Manual Label Generation Page within FedEx App - Handles all actions related to manual label generation
export class GenerateLabelManuallyPage extends BasePage {
  // Locators
  readonly heading: Locator;
  readonly generatePackagesButton: Locator;
  readonly getShippingRatesButton: Locator;
  readonly retryButton: Locator;
  readonly generateLabelButton: Locator;
  readonly radioButtons: Locator;
  readonly failedRatesBox: Locator;
  readonly clickBackButton: Locator;
  readonly failedRatesMenuButton: Locator;
  readonly viewXmlMenuItem: Locator;
  readonly xmlViewerModal: Locator;
  readonly xmlModalCloseButton: Locator;
  readonly xmlModalResponseSection: Locator;
  readonly xmlModalPreContent: Locator;
  readonly getShippingServiceLabel: (radioId: string) => Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.heading = this.appFrame.locator('h1');
    this.generatePackagesButton = this.appFrame.getByRole('button', { name: 'Generate Packages' });
    this.getShippingRatesButton = this.appFrame.getByRole('button', { name: 'Get shipping rates' });
    this.retryButton = this.appFrame.getByRole('button', { name: 'Retry' });
    this.generateLabelButton = this.appFrame.getByRole('button', { name: 'Generate Label' });
    this.radioButtons = this.appFrame.locator('input[type="radio"][name]');
    this.failedRatesBox = this.appFrame.locator('div.Polaris-Box').filter({ hasText: 'Failed to fetch rates' });
    this.clickBackButton = this.appFrame.getByRole('button', { name: 'Orders' });

    // XML viewer modal locators
    this.xmlViewerModal = this.appFrame.locator('div[role="dialog"][aria-modal="true"]');
    this.failedRatesMenuButton = this.failedRatesBox
      .locator('button')
      .filter({
        has: this.appFrame.locator('svg path[d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"]'),
      })
      .first();
    this.viewXmlMenuItem = this.appFrame.locator('button[role="menuitem"]').filter({ hasText: 'View XML' }).first();
    this.xmlModalCloseButton = this.xmlViewerModal.locator('button[aria-label="Close"]');
    this.xmlModalResponseSection = this.xmlViewerModal.locator('.Polaris-Layout__Section--oneHalf').nth(1);
    this.xmlModalPreContent = this.xmlModalResponseSection.locator('pre');

    // Dynamic locators
    this.getShippingServiceLabel = (radioId: string) => this.appFrame.locator(`label[for="${radioId}"]`);
  }

  // Verify order ID is displayed in manual page heading
  async verifyOrderHeading(orderID: string): Promise<void> {
    await expect(this.heading).toContainText(orderID, { timeout: 8000 });
  }

  // Generate packages manually
  async generatePackages(): Promise<void> {
    await this.generatePackagesButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.generatePackagesButton.click();
  }

  // Extract and parse error/warning logs from XML viewer modal
  async getErrorFromXML(): Promise<string> {
    try {
      await this.failedRatesMenuButton.waitFor({ state: 'visible', timeout: 5000 });
      await this.failedRatesMenuButton.click();

      await this.page.waitForTimeout(1000);

      await this.viewXmlMenuItem.waitFor({ state: 'visible', timeout: 5000 });
      await this.viewXmlMenuItem.click();

      await this.xmlViewerModal.waitFor({ state: 'visible', timeout: 5000 });

      const xmlContent = await this.xmlModalPreContent.textContent();

      await this.xmlModalCloseButton.click();

      if (xmlContent) {
        const errorInfo = this.parseErrorFromXML(xmlContent);
        return errorInfo;
      }

      return 'No XML content found';
    } catch (error) {
      return 'Unable to extract error logs';
    }
  }

  // Parse error/warning details from XML content
  private parseErrorFromXML(xmlContent: string): string {
    try {
      const codeMatch = xmlContent.match(/<code>([^<]+)<\/code>/);
      const messageMatch = xmlContent.match(/<message>([^<]+)<\/message>/);

      if (codeMatch || messageMatch) {
        const code = codeMatch ? codeMatch[1] : 'N/A';
        const message = messageMatch ? messageMatch[1] : 'N/A';
        return `Error Code: ${code}\nMessage: ${message}`;
      }

      return 'Could not parse error details from XML';
    } catch (error) {
      return 'Error parsing XML content';
    }
  }

  // Get shipping rates with retry logic for FedEx API errors
  async getShippingRates(maxRetries: number = 5): Promise<void> {
    await this.getShippingRatesButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.getShippingRatesButton.click();

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.radioButtons.first().waitFor({ state: 'visible', timeout: 10000 });
        console.log(`✅ Shipping rates loaded successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

        try {
          const retryExists = (await this.retryButton.count()) > 0;

          if (retryExists && attempt < maxRetries) {
            console.log('🔄 Retry button found, clicking...');
            await this.retryButton.click();
            await this.page.waitForTimeout(2000);
          } else if (!retryExists && attempt < maxRetries) {
            console.log('⏳ Waiting before next attempt...');
            await this.page.waitForTimeout(3000);
          }
        } catch (retryError) {
          console.log('❌ Error checking retry button:', retryError);
          if (attempt >= maxRetries) break;
        }
      }
    }

    const errorDetails = await this.getErrorFromXML();
    console.log('FedEx API Error Details:\n', errorDetails);

    throw new Error(`Failed to load shipping rates after ${maxRetries} attempts: ${lastError?.message}\n\nFedEx Error:\n${errorDetails}`);
  }

  // Select the first shipping service
  async selectFirstShippingService(): Promise<void> {
    const count = await this.radioButtons.count();

    if (count === 0) {
      throw new Error('No shipping services available to select');
    }

    const firstService = this.radioButtons.first();
    const radioId = await firstService.getAttribute('id');
    const firstServiceLabel = this.getShippingServiceLabel(radioId!);

    await firstServiceLabel.click();
    await expect(firstService).toBeChecked({ timeout: 3000 });
  }

  // click generate label button in manual label generation page
  async clickGenerateLabelButtonInManualLabelGenerationPage(): Promise<void> {
    await this.generateLabelButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.generateLabelButton.click();
    console.log('🚀 Generate Label button clicked - label generation started');
  }

  /*   await shopifyAdmin.searchAndOpenOrder(sharedOrderID, 3);
    await shopifyAdmin.openMoreActions();
    await shopifyAdmin.openManualLabelPage();

    */

  async waitUntilGeneratePackageButtonVisible(): Promise<void> {
    await this.generatePackagesButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  //Generic method to generate label manually
  async generateLabelInApp(): Promise<void> {
    await this.waitUntilGeneratePackageButtonVisible();
    await this.generatePackages();
    await this.getShippingRates();
    await this.selectFirstShippingService();
    await this.clickGenerateLabelButtonInManualLabelGenerationPage();
  }

  async clickBackButtonInManualLabelGenerationPage(): Promise<void> {
    await this.clickBackButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.clickBackButton.click();
  }
}
