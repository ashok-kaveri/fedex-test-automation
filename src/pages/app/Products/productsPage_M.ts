import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../basePage';

export class ProductsPage_M extends BasePage {
  // Locators
  readonly searchFilterButton: Locator;
  readonly searchInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    this.searchFilterButton = this.appFrame.locator('button[aria-label="Search and filter results"]');
    this.searchInput = this.appFrame.getByPlaceholder('Search by Product Name (Esc to cancel)');
    this.saveButton = this.appFrame.getByRole('button', { name: 'Save' }).first();
  }

  async searchAndSelectProductByName(productName: string) {
    await this.searchFilterButton.click();

    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.fill(productName);

    await this.appFrame.getByRole('button', { name: productName }).click();
  }

  async addProductDimensions(data: { length: number; width: number; height: number; unit?: 'cm' | 'in' | 'ft' | 'mt' }) {
    const fields: [string, number][] = [
      ['Length', data.length],
      ['Width', data.width],
      ['Height', data.height],
    ];

    for (const [label, value] of fields) {
      await this.appFrame.getByLabel(label).first().fill(String(value));
    }

    if (data.unit) {
      for (const unit of ['lengthUnit', 'widthUnit', 'heightUnit']) {
        await this.appFrame.locator(`select[name="${unit}"]`).selectOption(data.unit);
      }
    }
  }

  async setSupplementaryOption(label: 'Is Alcohol' | 'Is Dangerous Goods' | 'Is Battery' | 'Is Dry Ice Needed' | 'Is this product pre-packed?', enable: boolean) {
    const checkbox = this.appFrame.getByRole('checkbox', { name: label });
    const isChecked = await checkbox.isChecked();

    if (enable !== isChecked) {
      await checkbox.click({ force: true });
    }
  }

  async selectAlcoholRecipient(type: 'CONSUMER' | 'LICENSEE') {
    await this.appFrame.locator('select[name="alcoholRecipientType"]').selectOption(type);
  }

  async configureDangerousGoods(data: {
    option?: 'LIMITED_QUANTITIES_COMMODITIES' | 'HAZARDOUS_MATERIALS' | 'ORM_D';
    accessibility?: 'ACCESSIBLE' | 'INACCESSIBLE';
    regulationType?: 'ADR' | 'DOT' | 'IATA' | 'ORMD';
    regulatoryId?: string;
    packagingGroup?: 'DEFAULT' | 'I' | 'II' | 'III';
    properShippingName?: string;
    hazardClass?: string;
    labelText?: string;
  }) {
    const frame = this.appFrame;

    if (data.option) {
      await frame.locator('select[name="dangerousGoodsOption"]').selectOption(data.option);
    }

    if (data.accessibility) {
      await frame.locator('select[name="dangerousGoodsAccessibilityType"]').selectOption(data.accessibility);
    }

    if (data.regulationType) {
      await frame.locator('select[name="dangerousGoodsRegulationType"]').selectOption(data.regulationType);
    }

    const fields: Record<string, string | undefined> = {
      regulatoryId: data.regulatoryId,
      properShippingName: data.properShippingName,
      hazardClass: data.hazardClass,
      labelText: data.labelText,
    };

    for (const [name, value] of Object.entries(fields)) {
      if (value !== undefined) {
        await frame.locator(`input[name="${name}"]`).fill(value);
      }
    }

    if (data.packagingGroup) {
      await frame.locator('select[name="packagingGroup"]').selectOption(data.packagingGroup);
    }
  }

  async configureBattery(data: { material?: 'LITHIUM_ION' | 'LITHIUM_METAL'; packing?: 'CONTAINED_IN_EQUIPMENT' | 'PACKED_WITH_EQUIPMENT' }) {
    const frame = this.appFrame;

    if (data.material) {
      await frame.locator('select[name="batteryMaterial"]').selectOption(data.material);
    }

    if (data.packing) {
      await frame.locator('select[name="batteryPacking"]').selectOption(data.packing);
    }
  }

  async setDryIceWeight(weight: number) {
    await this.appFrame.locator('input[name="dryIceWeight"]').fill(String(weight));
  }

  async configureShippingDetails(data: {
    signatureOption?: 'ADULT' | 'DIRECT' | 'INDIRECT' | 'NO_SIGNATURE_REQUIRED' | 'SERVICE_DEFAULT' | 'AS_PER_THE_GENERAL_SETTINGS';
    freightClass?: string;
    declaredValue?: number;
  }) {
    const frame = this.appFrame;

    if (data.signatureOption) {
      await frame.locator('select[name="signatureOptionType"]').selectOption(data.signatureOption);
    }

    if (data.freightClass) {
      await frame.locator('select[name="productFreightClass"]').selectOption(data.freightClass);
    }

    if (data.declaredValue !== undefined) {
      await frame.locator('input[name="declaredValue"]').fill(String(data.declaredValue));
    }
  }

  async configureCustomsInformation(data: { countryOfManufacture?: string; stateOfManufacture?: string; districtOfManufacture?: string; hsCode?: string; customsDescription?: string }) {
    const frame = this.appFrame;

    if (data.countryOfManufacture) {
      await frame.locator('select[name="countryOfManufacture"]').selectOption(data.countryOfManufacture);
    }

    const fields: Record<string, string | undefined> = {
      stateOfManufacture: data.stateOfManufacture,
      districtOfManufacture: data.districtOfManufacture,
      HSCode: data.hsCode,
      productDescription: data.customsDescription,
    };

    for (const [name, value] of Object.entries(fields)) {
      if (value !== undefined) {
        await frame.locator(`input[name="${name}"]`).fill(value);
      }
    }
  }

  async saveProduct() {
    await this.saveButton.click();
  }
}
