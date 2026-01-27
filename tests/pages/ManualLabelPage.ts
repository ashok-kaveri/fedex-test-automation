import { Page, FrameLocator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { AppFrameContentLocators } from '../locators/app-frame.locators';
import { ManualLabelPageLocators } from '../locators/manual-label-page.locators';

// Page Object for Manual Label Generation Page within FedEx App - Handles all actions related to manual label generation
export class ManualLabelPage extends BasePage {
  private readonly appFrame: FrameLocator;
  private readonly appContent: AppFrameContentLocators;
  private readonly locators: ManualLabelPageLocators;

  constructor(page: Page) {
    super(page);
    this.appFrame = this.getIframe('app-iframe');
    this.appContent = new AppFrameContentLocators(this.appFrame);
    this.locators = new ManualLabelPageLocators(this.appFrame);
  }

  // Verify order ID is displayed in manual page heading
  async verifyOrderHeading(orderID: string): Promise<void> {
    await expect(this.locators.heading).toContainText(orderID, { timeout: 8000 });
  }

  // Generate packages manually
  async generatePackages(): Promise<void> {
    await this.locators.generatePackagesButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.locators.generatePackagesButton.click();
  }

  // Extract and parse error/warning logs from XML viewer modal
  async getErrorFromXML(): Promise<string> {
    try {
      const moreOptionsBtn = this.locators.getFailedRatesMenuButton();
      await moreOptionsBtn.waitFor({ state: 'visible', timeout: 5000 });
      await moreOptionsBtn.click();
      
      await this.page.waitForTimeout(1000);
      
      const viewXmlBtn = this.locators.getViewXmlMenuItem();
      await viewXmlBtn.waitFor({ state: 'visible', timeout: 5000 });
      await viewXmlBtn.click();
      
      const modal = this.locators.getXmlViewerModal();
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      
      const xmlContent = await this.locators.getXmlModalPreContent().textContent();
      
      const closeBtn = this.locators.getXmlModalCloseButton();
      await closeBtn.click();
      
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
  async getShippingRates(maxRetries: number = 3): Promise<void> {
    await this.locators.getShippingRatesButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.locators.getShippingRatesButton.click();
    
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.locators.radioButtons.first().waitFor({ state: 'visible', timeout: 10000 });
        return;
      } catch (error) {
        lastError = error as Error;
        
        const retryExists = await this.locators.retryButton.count() > 0;
        
        if (retryExists && attempt < maxRetries) {
          await this.locators.retryButton.click();
          await this.page.waitForTimeout(2000);
        } else if (!retryExists && attempt < maxRetries) {
          await this.page.waitForTimeout(3000);
        }
      }
    }
    
    const errorDetails = await this.getErrorFromXML();
    console.log('FedEx API Error Details:\n', errorDetails);
    
    throw new Error(`Failed to load shipping rates after ${maxRetries} attempts: ${lastError?.message}\n\nFedEx Error:\n${errorDetails}`);
  }

  // Select the first shipping service
  async selectFirstShippingService(): Promise<void> {
    const count = await this.locators.radioButtons.count();
    
    if (count === 0) {
      throw new Error('No shipping services available to select');
    }
    
    const firstService = this.locators.radioButtons.first();
    const radioId = await firstService.getAttribute('id');
    const firstServiceLabel = this.locators.getShippingServiceLabel(radioId!);
    
    await firstServiceLabel.click();
    await expect(firstService).toBeChecked({ timeout: 3000 });
  }

  // Generate label
  async generateLabel(): Promise<void> {
    await this.locators.generateLabelButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.locators.generateLabelButton.click();
  }
}
