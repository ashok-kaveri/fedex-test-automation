import { Page, FrameLocator, Locator, expect } from '@playwright/test';
import { AppFrameHelper } from '../../../helpers/appFrameHelper';
import { ShopifyAdminPage } from '../../shopify/ShopifyAdminPage';
import { LoadFnOutput } from 'module';

export class SideDockPage {
  readonly page: Page;
  private readonly appFrame: FrameLocator;

  readonly shippingAddressClassification: Locator;
  readonly addressClassificationDropdown: Locator;

  readonly holdAtLocationBtn: Locator;
  readonly holdLocationLabel: Locator;
  readonly holdLocationDropdown: Locator;

  readonly modalContainer: Locator;
  readonly modalYesButton: Locator;
  readonly modalNoButton: Locator;
  readonly modalXButton: Locator;
  readonly modalCloseButton: Locator;

  readonly fedexSignatureLabel: Locator;
  readonly fedexSignatureDropdown: Locator;
  readonly selectedSignatureText: Locator;

  readonly thirdPartyInsuranceCheckbox: Locator;
  readonly thirdPartyInsuranceText: Locator;
  readonly insuranceEditButton: Locator;
  readonly includeInsuranceCheckbox: Locator;
  readonly liabilityTypeDropdown: Locator;
  readonly insuranceAmountDropdown: Locator;
  readonly percentageProductInput: Locator;

  readonly purposeOfShipmentDropdown: Locator;
  readonly termsOfSaleDropdown: Locator;
  readonly dutiesPaymentDropdown: Locator;

  readonly generateReturnLabelCheckbox: Locator;
  readonly generateReturnLabelEditButton: Locator;
  readonly returnPackagingType: Locator;
  readonly returnSignatureDropdown: Locator;

  readonly hazardousProductCheckbox: Locator;
  readonly hazardousProductEditButton: Locator;
  readonly hazardousPackagingType: Locator;
  readonly hazardousPackagingMaterial: Locator;

  readonly shipAfterDaysTextBox: Locator;
  readonly additionalSpecialServicesCheckbox: Locator;
  readonly additionalSpecialServicesEditButton: Locator;
  readonly shipperTinTypeDropDown: Locator;
  readonly nonStandardContainerCheckbox: Locator;
  readonly enableSatPickupCheckbox: Locator;
  readonly commInvoiceInfoCheckbox: Locator;
  readonly freightInfoCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appFrame = AppFrameHelper.getAppFrame(page);

    //modal locators
    this.modalContainer = this.appFrame.getByRole('dialog');
    this.modalYesButton = this.appFrame.locator("//span[text()='Yes']/ancestor::button");
    this.modalNoButton = this.appFrame.locator("//span[text()='No']/ancestor::button");
    this.modalXButton = this.appFrame.locator('button[aria-label="Close"]');
    this.modalCloseButton = this.appFrame.locator("//span[text()='Close']/ancestor::button");

    //Locators for side dock
    this.shippingAddressClassification = this.appFrame.getByLabel('Shipping Address Classification');
    this.addressClassificationDropdown = this.appFrame.getByLabel('Address classification');

    this.holdAtLocationBtn = this.appFrame.getByText('Hold at Location');
    this.holdLocationLabel = this.appFrame.getByLabel('Hold Location Point');
    this.holdLocationDropdown = this.modalContainer.locator("//select[@id=//label[text()='Hold Location Point']/@for]");

    this.fedexSignatureLabel = this.appFrame.getByLabel('FedEx® Delivery Signature Options');
    this.fedexSignatureDropdown = this.appFrame.locator('div:has(> .Polaris-Labelled__LabelWrapper:has-text("FedEx® Delivery Signature Options")) select');
    this.selectedSignatureText = this.appFrame.locator('.Polaris-Box').filter({ hasText: 'FedEx® Delivery Signature Options' }).locator('.Polaris-Select__SelectedOption');

    this.thirdPartyInsuranceText = this.appFrame.getByText('Add Third Party Insurance To Packages?');
    this.thirdPartyInsuranceCheckbox = this.appFrame.locator('.Polaris-Choice').filter({ hasText: 'Add Third Party Insurance To Packages?' }).getByRole('checkbox');
    this.insuranceEditButton = this.appFrame.locator('.Polaris-Choice__Label').filter({ hasText: 'Add Third Party Insurance To Packages?' }).getByRole('button');
    this.includeInsuranceCheckbox = this.modalContainer.getByLabel('Include Third Party Insurance In Commercial Invoice ?');
    this.liabilityTypeDropdown = this.modalContainer.getByLabel('Liability Type for Coverage (Applicable only for Freight shipments)');
    this.insuranceAmountDropdown = this.modalContainer.getByLabel('Insurance amount to be used:');
    this.percentageProductInput = this.appFrame.getByLabel('Percentage of Product Price');

    this.purposeOfShipmentDropdown = this.appFrame
      .locator('div')
      .filter({ has: this.appFrame.locator('label', { hasText: 'Purpose Of Shipment' }) })
      .locator('select');
    this.termsOfSaleDropdown = this.appFrame
      .locator('div')
      .filter({ has: this.appFrame.locator('label', { hasText: 'Terms Of Sale To be used in Commercial Invoice' }) })
      .locator('select');
    this.dutiesPaymentDropdown = this.appFrame.locator('select[name="dutiesPaymentTypeForAccount"]');

    this.generateReturnLabelCheckbox = this.appFrame.getByLabel('Generate return label along with forward label');
    this.generateReturnLabelEditButton = this.appFrame.locator('.Polaris-Choice__Label').filter({ hasText: 'Generate return label along with forward label' }).getByRole('button');
    this.returnPackagingType = this.modalContainer.getByLabel('Return Packaging Type');
    this.returnSignatureDropdown = this.modalContainer.getByLabel('FedEx® Delivery Signature For Return');

    this.hazardousProductCheckbox = this.appFrame.getByLabel('Does your shipment contains hazardous product');
    this.hazardousProductEditButton = this.appFrame.locator('.Polaris-Choice__Label').filter({ hasText: 'Does your shipment contains Hazardous Product?' }).getByRole('button');
    this.hazardousPackagingType = this.modalContainer.getByLabel('Type of Packaging');
    this.hazardousPackagingMaterial = this.modalContainer.getByLabel('Packaging Material');

    this.shipAfterDaysTextBox = this.appFrame.getByLabel('Ship After These(0 to 7) Many Days');
    this.additionalSpecialServicesCheckbox = this.appFrame.getByLabel('Additional special services');
    this.additionalSpecialServicesEditButton = this.appFrame.locator('.Polaris-Choice__Label').filter({ hasText: 'Additional special services' }).getByRole('button');
    this.shipperTinTypeDropDown = this.modalContainer.getByLabel('Shipper Tin Type');
    this.nonStandardContainerCheckbox = this.modalContainer.getByLabel('Is Non Standard Container shipment?').getByRole('checkbox');
    this.enableSatPickupCheckbox = this.modalContainer.getByLabel('Enable Saturday Pickup?').getByRole('checkbox');
    this.commInvoiceInfoCheckbox = this.modalContainer.getByLabel('Add Additional Commercial Invoice Information?').getByRole('checkbox');
    this.freightInfoCheckbox = this.modalContainer.getByLabel('Add Additional Freight Information?').getByRole('checkbox');
  }

  //Handler functions of side dock

  async selectShippingAddress(type: string) {
    await this.shippingAddressClassification.waitFor({ state: 'visible' });
    await this.shippingAddressClassification.selectOption(type);
  }

  async selectHAL(option: string) {
    //await this.holdAtLocationBtn.isVisible();
    await this.holdAtLocationBtn.click();
    await this.modalContainer.waitFor({ state: 'visible' });
    await this.holdLocationDropdown.waitFor({ state: 'visible' });
    await this.holdLocationDropdown.selectOption(option);
    await this.modalYesButton.click();
  }
  async selectFedExSignature(option: string) {
    await this.fedexSignatureDropdown.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(3000);
    await this.fedexSignatureDropdown.selectOption({ value: option });
  }

  async getFedExSelectedSignature() {
    await this.selectedSignatureText.waitFor({ state: 'visible' });
    return await this.selectedSignatureText.innerText();
  }

  async enableThirdPartyInsurance() {
    await this.thirdPartyInsuranceCheckbox.check({ force: true });
  }

  async disableThirdPartyInsurance() {
    await this.thirdPartyInsuranceCheckbox.uncheck({ force: true });
  }

  async addInsuranceDetails({ liabilityType, insuranceType, percentage }: { liabilityType: string; insuranceType: string; percentage?: any }) {
    await this.enableThirdPartyInsurance();
    await this.insuranceEditButton.click();
    await this.modalContainer.waitFor({ state: 'visible' });
    await this.includeInsuranceCheckbox.check();
    await this.liabilityTypeDropdown.selectOption(liabilityType);
    await this.insuranceAmountDropdown.selectOption(insuranceType);
    if (insuranceType === 'Percentage of Product Price') {
      await this.percentageProductInput.fill(String(percentage));
    }
    await this.modalCloseButton.click();
  }

  async selectPurposeOfShipment(option: string) {
    await this.purposeOfShipmentDropdown.selectOption(option);
  }

  async selectTermsOfSale(option: string) {
    await this.termsOfSaleDropdown.selectOption(option);
  }

  async selectDutiesPaymentType(option: string) {
    await this.dutiesPaymentDropdown.selectOption(option);
  }

  async selectGenerateReturnWithForwardCheckbox() {
    await this.generateReturnLabelCheckbox.check();
  }

  async selectGenerateReturnEditButton({ returnPackType, returnSignOption }) {
    await this.generateReturnLabelEditButton.click();
    await this.modalContainer.waitFor({ state: 'visible' });
    await this.returnPackagingType.selectOption(returnPackType);
    await this.returnSignatureDropdown.selectOption(returnSignOption);
    await this.modalCloseButton.click();
  }

  async enableHazardousproductCheckBox() {
    await this.hazardousProductCheckbox.check();
  }

  async selectHardousShipmentDetails({ hazPackType, HazPackMaterial }) {
    await this.hazardousProductEditButton.click();
    await this.modalContainer.waitFor({ state: 'visible' });
    await this.hazardousPackagingType.selectOption(hazPackType);
    await this.hazardousPackagingMaterial.selectOption(HazPackMaterial);
    await this.modalCloseButton.click();
  }

  async selectShipAfterDays(days: string) {
    await this.shipAfterDaysTextBox.fill(days);

    //With Spinner button
    //await this.appFrame.locator(".Polaris-TextField__Segment").first().click();
    //await this.appFrame.locator(".Polaris-TextField__Segment").last().click();
  }
}
