import { Page, Locator, FrameLocator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for FedEx App Manual Label Generation Page
 * All actions in this class occur within the manual label generation iframe
 */
export class FedExAppPage extends BasePage {
  private readonly appFrame: FrameLocator;

  constructor(page: Page) {
    super(page);
    this.appFrame = this.getIframe('app-iframe');
  }

  /**
   * Get manual page app frame for chaining
   */
  private get frame(): FrameLocator {
    return this.appFrame;
  }

  /**
   * Verify order ID is displayed in manual page heading
   */
  async verifyOrderHeadingInOrderSummary(orderID: string): Promise<void> {
    await expect(this.frame.locator('h1')).toContainText(orderID, { timeout: 8000 });
  }

  /**
   * Generate packages manually in the manual label generation page
   */
  async generatePackagesInManualPage(): Promise<void> {
    const generateBtn = this.frame.getByRole('button', { name: 'Generate Packages' });
    await generateBtn.waitFor({ state: 'visible', timeout: 8000 });
    await generateBtn.click();
  }

  /**
   * Extract and parse error/warning logs from XML viewer modal in manual page
   * Opens the dropdown menu, clicks "View XML", and extracts the error details
   */
  async getErrorFromXMLInManualLabelPage(): Promise<string> {
    try {
      // Find the shipping rates box that contains "Failed to fetch rates"
      const ratesBox = this.frame.locator('div.Polaris-Box').filter({ hasText: 'Failed to fetch rates' });
      
      // Within that box, find the three-dot menu button by looking for the SVG with three circles
      const moreOptionsBtn = ratesBox.locator('button').filter({
        has: this.frame.locator('svg path[d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"]')
      }).first();
      
      await moreOptionsBtn.waitFor({ state: 'visible', timeout: 5000 });
      await moreOptionsBtn.click();
      
      // Wait a moment for dropdown to render
      await this.page.waitForTimeout(1000);
      
      // Wait for dropdown to appear and click "View XML" - it's in an ActionList with role="menuitem"
      const viewXmlBtn = this.frame.locator('button[role="menuitem"]').filter({ hasText: 'View XML' }).first();
      await viewXmlBtn.waitFor({ state: 'visible', timeout: 5000 });
      await viewXmlBtn.click();
      
      // Wait for modal to appear
      const modal = this.frame.locator('div[role="dialog"][aria-modal="true"]');
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      
      // Extract the Response XML content
      const responseSection = modal.locator('.Polaris-Layout__Section--oneHalf').nth(1);
      const xmlContent = await responseSection.locator('pre').textContent();
      
      // Close the modal
      const closeBtn = modal.locator('button[aria-label="Close"]');
      await closeBtn.click();
      
      // Parse and extract error/warning information
      if (xmlContent) {
        const errorInfo = this.parseErrorFromXML(xmlContent);
        return errorInfo;
      }
      
      return 'No XML content found';
    } catch (error) {
      return 'Unable to extract error logs';
    }
  }

  /**
   * Parse XML response to extract error/warning details
   */
  private parseErrorFromXML(xmlContent: string): string {
    try {
      // Extract HighestSeverity
      const severityMatch = xmlContent.match(/<HighestSeverity>(.*?)<\/HighestSeverity>/);
      const severity = severityMatch ? severityMatch[1] : 'UNKNOWN';
      
      // Extract Notification details
      const notificationMatch = xmlContent.match(/<Notifications>([\s\S]*?)<\/Notifications>/);
      
      if (notificationMatch) {
        const notification = notificationMatch[1];
        const severityTypeMatch = notification.match(/<Severity>(.*?)<\/Severity>/);
        const codeMatch = notification.match(/<Code>(.*?)<\/Code>/);
        const messageMatch = notification.match(/<Message>(.*?)<\/Message>/);
        const localizedMessageMatch = notification.match(/<LocalizedMessage>(.*?)<\/LocalizedMessage>/);
        
        const errorDetails = {
          severity: severityTypeMatch ? severityTypeMatch[1] : severity,
          code: codeMatch ? codeMatch[1] : 'N/A',
          message: messageMatch ? messageMatch[1].trim() : 'No message',
          localizedMessage: localizedMessageMatch ? localizedMessageMatch[1].trim() : ''
        };
        
        return `Severity: ${errorDetails.severity}\nCode: ${errorDetails.code}\nMessage: ${errorDetails.message}`;
      }
      
      return `HighestSeverity: ${severity}\nNo detailed notification found`;
    } catch (error) {
      return `Failed to parse XML: ${(error as Error).message}`;
    }
  }

  /**
   * Get shipping rates in manual label generation page with retry logic
   * Handles retry button if rates fail to load
   */
  async getShippingRatesInManualPage(maxRetries: number = 3): Promise<void> {
    const ratesBtn = this.frame.getByRole('button', { name: 'Get shipping rates' });
    await ratesBtn.waitFor({ state: 'visible', timeout: 10000 });
    await ratesBtn.click();
    
    // Wait for either rates to load or retry button to appear
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if radio buttons (services) are visible in manual page
        const radioButtons = this.frame.locator('input[type="radio"][name]');
        await radioButtons.first().waitFor({ state: 'visible', timeout: 10000 });
        return;
      } catch (error) {
        lastError = error as Error;
        
        // Check if retry button exists in manual page
        const retryBtn = this.frame.getByRole('button', { name: 'Retry' });
        const retryExists = await retryBtn.count() > 0;
        
        if (retryExists && attempt < maxRetries) {
          await retryBtn.click();
          await this.page.waitForTimeout(2000);
        } else if (!retryExists && attempt < maxRetries) {
          // Wait a bit for rates to load in manual page
          await this.page.waitForTimeout(3000);
        }
      }
    }
    
    // If all retries failed, extract error logs from XML viewer
    const errorDetails = await this.getErrorFromXMLInManualLabelPage();
    console.log('FedEx API Error Details:\n', errorDetails);
    
    throw new Error(`Failed to load shipping rates in manual page after ${maxRetries} attempts: ${lastError?.message}\n\nFedEx Error:\n${errorDetails}`);
  }

  /**
   * Verify shipping services are visible in manual page and select the first service
   */
  async selectFirstShippingServiceInManualPage(): Promise<void> {
    // Verify services are loaded in manual page
    const radioButtons = this.frame.locator('input[type="radio"][name]');
    const count = await radioButtons.count();
    
    if (count === 0) {
      throw new Error('No shipping services available to select in manual page');
    }
    
    // Get the first radio button
    const firstService = radioButtons.first();
    
    // Get the radio button's id to find the matching label
    const radioId = await firstService.getAttribute('id');
    const firstServiceLabel = this.frame.locator(`label[for="${radioId}"]`);
    
    // Get service name from label
    const serviceName = await firstServiceLabel.textContent();
    
    // Click the label instead of the radio button (Polaris wraps it in a span that intercepts clicks)
    await firstServiceLabel.click();
    
    // Verify it's selected
    await expect(firstService).toBeChecked({ timeout: 3000 });
  }


  /**
   * Generate label in manual page
   */
  async generateManualLabel(): Promise<void> {
    const generateLabelBtn = this.frame.getByRole('button', { name: 'Generate Label' });
    await generateLabelBtn.waitFor({ state: 'visible', timeout: 5000 });
    await generateLabelBtn.click();
  }

  /**
   * Verify label generated successfully in manual page
   */
  async verifyLabelGeneratedInOrderSummary(): Promise<void> {
    await expect(this.frame.locator('#AppFrameMain')).toContainText('label generated', { timeout: 10000 });
    // Verify the Packages section shows a selected service (any service, not hardcoded to FedEx Ground)
    const packagesSection = this.frame.getByLabel('Packages', { exact: true });
    await expect(packagesSection).toBeVisible({ timeout: 5000 });
  }

  /**
   * Navigate from manual page to Orders page within the app
   */
  async navigateToOrdersPageInApp(): Promise<void> {
    const ordersBtn = this.frame.getByRole('button', { name: 'Orders' });
    await ordersBtn.waitFor({ state: 'visible', timeout: 5000 });
    await ordersBtn.click();
  }

  /**
   * Search for order in Orders page (after manual label generation) with retry logic
   */
  async searchOrderInApp(orderID: string, maxRetries: number = 3): Promise<void> {
    const searchBtn = this.frame.getByRole('button', { name: 'Search and filter results' });
    await searchBtn.waitFor({ state: 'visible', timeout: 8000 });
    await searchBtn.click();

    const searchInput = this.frame.getByRole('textbox', { name: /Search by order id/ });
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // Remove # prefix if present
    const cleanOrderID = orderID.replace(/^#/, '');
    
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await searchInput.clear();
        await searchInput.fill(cleanOrderID);
        await searchInput.press('Enter');
        
        // Wait for table to appear with the order
        await expect(this.frame.getByRole('table')).toContainText('label generated', { timeout: 8000 });
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(2000);
        }
      }
    }
    
    throw new Error(`Order ${orderID} not found in app table after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Verify order appears in table with label generated status
   */
  async verifyOrderInOrdersPage(): Promise<void> {
    await expect(this.frame.getByRole('table')).toContainText('label generated', { timeout: 10000 });
  }

  /**
   * Select all orders in the table
   */
  async selectAllOrdersInApp(): Promise<void> {
    const selectAllCell = this.frame.getByRole('cell', { name: 'Select all orders' });
    await selectAllCell.waitFor({ state: 'visible', timeout: 5000 });
    await selectAllCell.click();
  }

  /**
   * Request pickup for selected orders
   */
  async requestPickupInApp(): Promise<void> {
    // Open more actions
    const moreActionsBtn = this.frame.getByRole('button', { name: 'More actions' }).first();
    await moreActionsBtn.waitFor({ state: 'visible', timeout: 5000 });
    await moreActionsBtn.click();

    // Click Request Pick Up
    const requestPickupBtn = this.frame.getByRole('button', { name: 'Request Pick Up' });
    await requestPickupBtn.waitFor({ state: 'visible', timeout: 5000 });
    await requestPickupBtn.click();

    // Confirm
    const yesBtn = this.frame.getByRole('button', { name: 'Yes' });
    await yesBtn.waitFor({ state: 'visible', timeout: 8000 });
    await yesBtn.click();
  }

  /**
   * Verify pickup page is displayed
   */
  async verifyPickupPageInApp(): Promise<void> {
    await expect(this.frame.getByRole('heading')).toContainText('Pickups', { timeout: 10000 });
  }

  /**
   * Open pickup details for order
   */
  async openPickupDetailsInPickupPage(orderID: string): Promise<void> {
    const orderRow = this.frame.getByRole('table').getByText(orderID);
    await orderRow.waitFor({ state: 'visible', timeout: 10000 });
    await orderRow.click();
  }

  /**
   * Verify pickup details page
   */
  async verifyPickupDetailsInPickupPage(orderID: string): Promise<void> {
    await expect(this.frame.getByRole('heading')).toContainText('Pickup Details', { timeout: 10000 });
    await expect(this.frame.locator('#AppFrameMain')).toContainText(orderID, { timeout: 5000 });
  }

  /**
   * Verify pickup status
   */
  async verifyPickupStatusInPickupPage(expectedStatus: string): Promise<void> {
    await expect(this.frame.locator('#AppFrameMain')).toContainText(expectedStatus, { timeout: 8000 });
  }
}
