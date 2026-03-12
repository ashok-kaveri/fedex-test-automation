import { Page, Locator } from '@playwright/test';
import { BasePage } from '../basePage';

export class ShopifyProductPage extends BasePage {
  readonly page: Page;

  // ================= LOCATORS =================

  readonly addProductLink: Locator;
  readonly selectAllCheckbox: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly bulkEditMenuItem: Locator;
  readonly columnsButton: Locator;
  readonly grid: Locator;
  readonly checkedCheckboxes: Locator;
  readonly allRows: Locator;
  readonly rowTextInputFilter: Locator;
  readonly columnHeaders: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;

    this.addProductLink = this.page.getByRole('link', { name: 'Add product' });

    this.selectAllCheckbox = this.page.getByRole('checkbox', { name: /Select all/i });

    this.searchButton = this.page.getByRole('button', { name: 'Search and filter products' });

    this.searchInput = this.page.getByPlaceholder('Searching all products');

    this.bulkEditMenuItem = this.page.getByRole('menuitem', { name: 'Bulk edit' });

    this.columnsButton = this.page.getByRole('button', { name: 'Columns' });

    this.grid = this.page.locator('[role="grid"]');

    this.checkedCheckboxes = this.page.locator('input[type="checkbox"]:checked:not(:disabled)');
    this.allRows = this.page.locator('[role="row"]');
    this.rowTextInputFilter = this.page.locator('input[type="text"]');
    this.columnHeaders = this.page.locator('[role="columnheader"]');
  }

  // ================= ACTION METHODS =================

  async addNewProduct() {
    await this.addProductLink.click();
  }

  async selectProducts(productNames?: string[]) {
    if (!productNames || productNames.length === 0) {
      await this.selectAllCheckbox.click();
      return;
    }

    for (const name of productNames) {
      const row = this.page.getByRole('row').filter({
        has: this.page.getByRole('link', { name, exact: true }),
      });

      await row.getByRole('checkbox').click();
    }
  }

  async searchProduct(productName: string) {
    await this.searchButton.click();

    await this.searchInput.waitFor();
    await this.searchInput.fill(productName);
  }

  async openProductSummeryPage(productName: string) {
    const productLink = this.page.getByRole('link', { name: productName, exact: true });

    await productLink.waitFor();
    await productLink.click();
  }

  async clickBulkEditButton() {
    await this.bulkEditMenuItem.click();
  }

  async configureBulkEditFields(options: { enable?: string[]; disableAll?: boolean }) {
    const { enable = [], disableAll = false } = options;

    if (disableAll) {
      const checkedBoxes = this.checkedCheckboxes;
      const count = await checkedBoxes.count();

      for (let i = 0; i < count; i++) {
        await checkedBoxes.nth(i).click();
      }
    }

    for (const field of enable) {
      const checkbox = this.page.getByRole('checkbox', { name: field });

      if (!(await checkbox.isChecked())) {
        await checkbox.click();
      }
    }

    await this.clickButtonByName('Columns');
  }

  // ================= ROW HELPER =================

  private getRows(productName?: string) {
    const rows = this.allRows.filter({
      has: this.rowTextInputFilter,
    });

    if (!productName) return rows;
    return rows.filter({
      // eslint-disable-next-line no-restricted-syntax
      has: this.page.locator(`input[value="${productName}"]`),
    });
  }

  // ================= COLUMN HELPER =================

  private async getColumnIndex(columnName: string): Promise<number> {
    const headers = this.columnHeaders;
    const count = await headers.count();

    for (let i = 0; i < count; i++) {
      const text = await headers.nth(i).textContent();

      if (text?.trim().includes(columnName)) {
        return i + 1;
      }
    }

    throw new Error(`Column "${columnName}" not found`);
  }

  private async getCell(row: Locator, columnName: string) {
    const index = await this.getColumnIndex(columnName);
    // eslint-disable-next-line no-restricted-syntax
    return row.locator(`[role="gridcell"][aria-colindex="${index}"]`);
  }

  // ================= BULK EDIT FUNCTIONS =================

  async bulkUpdateTags({ tags, productName }: { tags: string[]; productName?: string }) {
    const rows = this.getRows(productName);
    const count = await rows.count();

    const columnIndex = await this.getColumnIndex('Tags');

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // eslint-disable-next-line no-restricted-syntax
      const cell = row.locator(`[role="gridcell"][aria-colindex="${columnIndex}"]`);

      await cell.dblclick({ force: true });
      // eslint-disable-next-line no-restricted-syntax
      const input = cell.locator('input');
      await input.waitFor();
      // eslint-disable-next-line no-restricted-syntax
      const removeButtons = cell.locator('button[aria-label^="Remove"]');
      const existingCount = await removeButtons.count();

      for (let j = 0; j < existingCount; j++) {
        await removeButtons.first().click();
      }

      for (const tag of tags) {
        await input.fill(tag);
        await input.press('Enter');
      }

      await this.page.keyboard.press('Tab');
    }
  }

  async bulkUpdatePrice({ price, productName }: { price: string; productName?: string }) {
    await this.grid.waitFor();

    const rows = this.getRows(productName);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cell = await this.getCell(row, 'Base price');
      // eslint-disable-next-line no-restricted-syntax
      await cell.locator('input').fill(price);
    }
  }

  async bulkUpdateSku({ sku, productName }: { sku: string; productName?: string }) {
    const rows = this.getRows(productName);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cell = await this.getCell(row, 'SKU');
      // eslint-disable-next-line no-restricted-syntax
      await cell.locator('input').fill(sku);
    }
  }

  async bulkUpdateWeight({ weight, unit, productName }: { weight: string; unit?: 'kg' | 'lb' | 'oz' | 'g'; productName?: string }) {
    const rows = this.getRows(productName);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cell = await this.getCell(row, 'Weight');
      // eslint-disable-next-line no-restricted-syntax
      await cell.locator('input').fill(weight);

      if (unit) {
        // eslint-disable-next-line no-restricted-syntax
        await cell.locator('select').selectOption({ label: unit });
      }
    }
  }

  async bulkUpdateHsCode({ hsCode, productName }: { hsCode: string; productName?: string }) {
    const rows = this.getRows(productName);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // eslint-disable-next-line no-restricted-syntax
      const cell = await this.getCell(row, 'Harmonized system code');
      // eslint-disable-next-line no-restricted-syntax
      await cell.locator('input').fill(hsCode);
    }
  }

  async bulkUpdateCountry({ country, productName }: { country: string; productName?: string }) {
    const columnIndex = await this.getColumnIndex('Country of origin');

    const rows = this.getRows(productName);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // eslint-disable-next-line no-restricted-syntax
      const cell = row.locator(`[role="gridcell"][aria-colindex="${columnIndex}"]`);
      // eslint-disable-next-line no-restricted-syntax
      await cell.click();
      // eslint-disable-next-line no-restricted-syntax
      const select = cell.locator('select');

      await select.selectOption({ value: country });

      await this.page.keyboard.press('Tab');
    }
  }
}
