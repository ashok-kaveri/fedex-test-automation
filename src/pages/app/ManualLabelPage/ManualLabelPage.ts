import { Page, Locator, expect } from '@playwright/test';
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

  readonly ratesActionMenu: Locator;
  // readonly rateViewLogsButton: Locator;
  readonly rateDownloadLogsButton: Locator;
  readonly viewAddressLogsButton: Locator;
  readonly ratesLogHeader: Locator;
  readonly rateRequestContainer: Locator;
  // readonly logDialogCrossCloseButton: Locator;
  readonly requestHeader: Locator;

  readonly xmlRequestContentArea: Locator;
  readonly fetchXMLMenuButton: Locator;
  readonly viewXmlMenuLogItem: Locator;
  readonly XmlCloseButton: Locator;
  readonly failedRatesMenuButton: Locator;
  readonly viewRateLog: Locator;
  readonly xmlViewerModal: Locator;
  readonly dialogModalCloseButton: Locator;
  readonly LogModalRequestSection: Locator;
  readonly LogModalResponseSection: Locator;
  // readonly xmlModalPreContent: Locator;
  readonly productPrice: Locator;
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
    this.fetchXMLMenuButton = this.appFrame.getByRole('button').filter({ hasText: /^$/ }).nth(5);
    this.viewXmlMenuLogItem = this.appFrame.getByRole('menuitem', { name: 'View Logs' });
    this.XmlCloseButton = this.appFrame.locator('button.Polaris-Button--primary').filter({ hasText: 'Close' });
    // this.xmlRequestContentArea = this.appFrame.locator('pre').filter({ hasText: '<?xml version="1.0" encoding' });
    this.xmlRequestContentArea = this.appFrame.locator('pre.Polaris-Text--root').first();
    // this.viewXmlMenuLogItem = this.appFrame.getByRole('menuitem', { name: 'View XML' });
    this.XmlCloseButton = this.appFrame.locator('button.Polaris-Button--primary').filter({ hasText: 'Close' });
    // this.xmlRequestContentArea = this.appFrame.locator('pre').filter({ hasText: '<?xml version="1.0" encoding' });

    this.ratesActionMenu = this.appFrame.locator('.Polaris-Box').filter({ hasText: 'Shipping rates from account' }).locator('button[aria-controls]');
    this.viewRateLog = this.appFrame.locator('button[role="menuitem"]').filter({ hasText: 'View Logs' }).first();
    this.rateDownloadLogsButton = this.appFrame.locator('.Polaris-Popover').getByRole('menuitem', { name: 'Download Logs' });
    this.viewAddressLogsButton = this.appFrame.locator('.Polaris-Popover').getByRole('menuitem', { name: 'View Address Logs' });
    this.ratesLogHeader = this.appFrame.getByRole('dialog').getByRole('heading', { name: 'Rates Log' });
    this.requestHeader = this.appFrame.getByRole('heading', { name: 'Request', exact: true });
    this.rateRequestContainer = this.appFrame.getByRole('dialog').locator('pre').first();
    this.productPrice = this.appFrame.locator('p.Polaris-Text--end');

    // XML viewer modal locators
    this.xmlViewerModal = this.appFrame.locator('div[role="dialog"][aria-modal="true"]');
    this.failedRatesMenuButton = this.failedRatesBox
      .locator('button')
      .filter({
        has: this.appFrame.locator('svg path[d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"]'),
      })
      .first();
    this.dialogModalCloseButton = this.xmlViewerModal.locator('button[aria-label="Close"]');
    this.LogModalRequestSection = this.xmlViewerModal.locator('.Polaris-Layout__Section--oneHalf').nth(0).locator('pre');
    this.LogModalResponseSection = this.xmlViewerModal.locator('.Polaris-Layout__Section--oneHalf').nth(1).locator('pre');

    // Dynamic locators
    this.getShippingServiceLabel = (radioId: string) => this.appFrame.locator(`label[for="${radioId}"]`);
  }

  // Verify order ID is displayed in manual page heading
  async verifyOrderHeading(orderID: string): Promise<void> {
    await expect(this.heading).toContainText(orderID, { timeout: 10000 });
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

      await this.viewRateLog.waitFor({ state: 'visible', timeout: 5000 });
      await this.viewRateLog.click();

      await this.xmlViewerModal.waitFor({ state: 'visible', timeout: 5000 });

      const xmlContent = await this.LogModalResponseSection.textContent();

      await this.dialogModalCloseButton.click();

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

  async selectShippingServiceForSignature(serviceValue: string): Promise<void> {
    const radio = this.appFrame.locator(`input[type="radio"][value="${serviceValue}"]`);
    await radio.waitFor({ state: 'visible', timeout: 10000 });
    await radio.scrollIntoViewIfNeeded();
    await radio.check({ force: true });
    await expect(radio).toBeChecked();
  }

  async waitUntilGeneratePackageButtonVisible(): Promise<void> {
    // await this.page.reload();
    await this.waitForLoadingToComplete();
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

  //Method to Verify Rate request logs
  async openRateRequestLog() {
    await this.waitUntilGeneratePackageButtonVisible();
    await this.generatePackages();
    await this.getShippingRates();
    await this.selectShippingServiceForSignature('FEDEX_2_DAY');
    await this.clickRateActionsMenuInShippingRates();
    await this.clickViewLogsFromRatesMenu();
    await this.requestHeader.waitFor({ state: 'visible', timeout: 5000 });
  }

  async closeModal() {
    // Wait for the button to be ready, then click
    await this.dialogModalCloseButton.waitFor({ state: 'visible' });
    await this.dialogModalCloseButton.click();
    await this.xmlViewerModal.waitFor({ state: 'hidden' });
  }

  async clickBackButtonInManualLabelGenerationPage(): Promise<void> {
    await this.clickBackButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.clickBackButton.click();
  }

  async clickRateActionsMenuInShippingRates() {
    await this.clickBackButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.ratesActionMenu.click();
  }

  async clickViewLogsFromRatesMenu() {
    await this.clickBackButton.waitFor({ state: 'visible', timeout: 5000 });
    await this.viewRateLog.click();
  }

  async getProductPriceValue(): Promise<number> {
    const rawText = await this.productPrice.innerText();
    const parts = rawText.split('x');
    const pricePart = parts.length > 1 ? parts[1] : rawText;
    const cleanPrice = pricePart.replace(/[^\d.]/g, '');
    return parseFloat(cleanPrice);
  }

  async getInsuranceValueFromRequestLog() {
    const logs = await this.getParsedDataFromRequestLog();
    return logs?.requestObject?.requestedShipment?.requestedPackageLineItems?.[0]?.declaredValue?.amount || null;
  }

  async getParsedDataFromRequestLog() {
    await this.requestHeader.waitFor({ state: 'visible', timeout: 5000 });
    const logString = await this.LogModalRequestSection.innerText();
    const trimmedLog = logString.trim();
    const jsonData = JSON.parse(trimmedLog);
    await this.closeRatesLog();
    return jsonData;
  }

  async getShipmentSpecialServicesFromRequestLog() {
    const logs = await this.getParsedDataFromRequestLog();
    return logs?.requestObject?.requestedShipment?.shipmentSpecialServices?.specialServiceTypes || [];
  }

  async getSignatureValueFromRequestLog() {
    const logs = await this.getParsedDataFromRequestLog();
    return logs?.requestObject?.requestedShipment?.requestedPackageLineItems?.[0]?.packageSpecialServices?.signatureOptionType || null;
  }

  async getDimensionsFromRequestLog() {
    const logs = await this.getParsedDataFromRequestLog();
    const dimensions = logs?.requestObject?.requestedShipment?.requestedPackageLineItems?.[0]?.dimensions || null;
    return dimensions;
  }

  async getWeightFromRequestLog() {
    const logs = await this.getParsedDataFromRequestLog();
    const weight = logs?.requestObject?.requestedShipment?.requestedPackageLineItems?.[0]?.weight?.value || null;
    return weight;
  }

  async getTotalPackageWeightFromRequestLog() {
    const logs = await this.getParsedDataFromRequestLog();
    return logs?.requestObject?.requestedShipment?.totalWeight || null;
  }

  async validateDimensionsFromLogs(input: { length: number; width: number; height: number; unit?: 'in' | 'cm' | 'ft' | 'mt' }) {
    const logs = await this.getParsedDataFromRequestLog();
    const packageItem = logs?.requestObject?.requestedShipment?.requestedPackageLineItems?.[0];
    const apiDimensions = packageItem?.dimensions;
    const apiWeight = packageItem?.weight?.value;
    expect(apiDimensions).not.toBeNull();
    const convertToInches = (value: number, unit?: string) => {
      if (!unit || unit === 'in') return Math.ceil(value);
      const map: Record<string, number> = {
        cm: 1 / 2.54,
        ft: 12,
        mt: 39.37,
      };
      return Math.ceil(value * (map[unit] || 1));
    };

    const expectedLength = convertToInches(input.length, input.unit);
    const expectedWidth = convertToInches(input.width, input.unit);
    const expectedHeight = convertToInches(input.height, input.unit);

    expect(apiDimensions.length).toBe(expectedLength);
    expect(apiDimensions.width).toBe(expectedWidth);
    expect(apiDimensions.height).toBe(expectedHeight);
    expect(apiDimensions.units).toBe('IN');

    console.log('Expected:', expectedLength, expectedWidth, expectedHeight);
    console.log('Actual:', apiDimensions);
    return apiWeight;
  }

  async closeRatesLog() {
    await this.dialogModalCloseButton.click();
    await expect(this.appFrame.getByRole('dialog')).toBeHidden();
  }
  // Generic method to get XML request content for verification in tests
  async getXmlRequestContent(): Promise<string> {
    await this.fetchXMLMenuButton.click();
    await this.viewXmlMenuLogItem.waitFor({ state: 'visible', timeout: 5000 });
    await this.viewXmlMenuLogItem.click();
    await this.xmlRequestContentArea.waitFor({ state: 'visible', timeout: 5000 });
    const xmlContent = (await this.xmlRequestContentArea.textContent()) || '';

    await this.XmlCloseButton.waitFor({ state: 'attached' });
    await this.XmlCloseButton.scrollIntoViewIfNeeded();
    await this.XmlCloseButton.click({ force: true });

    return xmlContent;
  }

  // Deprecated: use getXmlRequestContent instead. Returning content for backward compatibility in the transition.
  async verifySignatureOptionInXmlRequest(): Promise<string> {
    return await this.getXmlRequestContent();
  }

  // Returns XML content to verify dry ice details in test file
  async verifyDryIceInXmlRequest(): Promise<string> {
    return await this.getXmlRequestContent();
  }

  // Returns XML content to verify alcohol details in test file
  async verifyAlcoholInXmlRequest(): Promise<string> {
    return await this.getXmlRequestContent();
  }

  // Returns XML content to verify battery details in test file
  async verifyBatteryInXmlRequest(): Promise<string> {
    return await this.getXmlRequestContent();
  }
}
