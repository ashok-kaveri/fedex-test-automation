# FedEx Test Automation

Playwright + TypeScript automation for FedEx Shopify App.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env  # Add your credentials
```

**⚠️ First Time Setup:** You have to run setup once in your local after clone
```bash
npx playwright test --project="setup" --headed
```

## Running Tests

### Run Login Setup Only
```bash
npx playwright test --project="setup" --headed
```
Creates `auth.json` with saved session. Run this first or when session expires.

### Run Single Test File
```bash
npx playwright test tests/suites/label_generation/manualLabelGeneration.spec.ts --project="Google Chrome" --hea```

### Run All Tests
```bash
npx playwright test --project="Google Chrome" --headed
```

### Run All (Setup + Tests)
```bash
npx playwright test --headed
```
Runs setup first, then all tests in chromium.

### View Report
```bash
npx playwright show-report
```

## Environment Variables

Create `.env` file:

```env
STORE=your-store-name
SHOPIFY_ACCESS_TOKEN=your-token
USER_EMAIL=your-email
USER_PASSWORD=your-password
SHOPIFY_API_VERSION=2023-01
SIMPLE_PRODUCTS_JSON=[{"product_id":123,"variant_id":456}]
SHIPPING_ADDRESS_JSON=[{"street":"123 Main St"},{"city":"Los Angeles"},{"state":"CA"},{"countryCode":"US"},{"zip":"90001"}]
```

## ESLint

The project uses `.eslintrc.js` to enforce code quality across all TypeScript files.

### Run ESLint
```bash
npx eslint .
```

### Rules Overview

**All files:**
- `no-explicit-any` — warns when `any` type is used
- `no-console` — warns on `console.log` (except helper/setup files)

**Spec files (`tests/**/*.spec.ts`):**
- `playwright/no-wait-for-timeout` — warns on hard waits (blocks if > 3 s)
- `playwright/expect-expect` — every test must have at least one `expect()`
- `playwright/no-force-option` — warns on `force: true`
- `playwright/no-skipped-test` — warns on skipped tests
- `playwright/no-focused-test` — blocks `test.only` / `it.only`
- Raw `page.*` calls are **blocked** — use page objects (`pages.xxx.method()`) instead

**Page object files (`src/pages/**/*.ts`):**
- Locators must be defined as `readonly` class properties in the constructor, not inside methods
- Hard waits > 3 s are blocked
- `page.pause()` is blocked — use debugger breakpoints instead

**Helper / setup files (`src/helpers/**`, `src/setup/**`):**
- `no-console` is turned **off** — logging is allowed here

## Notes

- **Session expired?** Delete `auth.json` to force fresh login
- **CAPTCHA appears?** Solve manually, test continues automatically
- Tests run serially in one browser window using shared context

# 🛒 Order & Address Configuration (Short)

---

## 📦 Products

Configured in:

```
src/config/products.config.ts
```

Add new store:

```ts
'my-store': {
  simple: [{ product_id: 123, variant_id: 456 }],
  variable: [],
  digital: [],
}
```

---

## 📍 Addresses (Global)

Configured in:

```
src/config/address.config.ts
```

Example:

```ts
export const ADDRESS_CONFIG = {
  default: { ... },

  US: { ... },
  UK: { ... },
  CA: { ... },
};
```

* No store mapping ❌
* Shared across all stores ✅
* Add unlimited countries 🌍

---

## 🚀 Usage

### ✅ Default (simple product + default address)

```ts
await orderUploader.uploadOrder();
```

---

### ✅ With address (any country)

```ts
await orderUploader.uploadOrder('US');
await orderUploader.uploadOrder('UK');
await orderUploader.uploadOrder('CA');
```

---

### ✅ Multiple products

```ts
await orderUploader.uploadOrderWithMultipleProducts([
  { productType: 'simple', productIndexes: [0], quantities: [1] },
]);
```

---

### ✅ Multiple products + address

```ts
await orderUploader.uploadOrderWithMultipleProducts(
  [{ productType: 'simple' }],
  'UK'
);
```

---

## 📦 Bulk Order Creation

Use this when a test case needs multiple orders (bulk buy scenarios).  
No browser, no config.json pasting, no separate CLI tool needed.

### How it works

There are **2 modes**:

| Mode | When to use |
|---|---|
| **Clone from existing order** | You need exact same products/address as a real order |
| **Fresh orders** | You just need N basic orders to appear in the FedEx app |

---

### ▶️ Run from terminal

**Clone an existing order N times** *(recommended for bulk-buy test cases)*
```bash
TEMPLATE_ORDER_ID=6888460681264 ORDER_COUNT=25 npm run seed:bulk
```
- `TEMPLATE_ORDER_ID` — the numeric ID from the Shopify admin URL:  
  `admin.shopify.com/.../orders/`**`6888460681264`**  
  Pick any unfulfilled order. The script fetches it via API automatically — no `.json` trick needed.
- `ORDER_COUNT` — how many copies to create

**Create N fresh orders** *(uses productsconfig.json — simple product, US address)*
```bash
ORDER_COUNT=10 npm run seed:bulk
```

**Default — 5 fresh orders**
```bash
npm run seed:bulk
```

---

### Output
```
📦 Cloning order #6888460681264 × 25…
[ShopifyOrderUploader] 1/25 → #1665
[ShopifyOrderUploader] 2/25 → #1666
...
✅ Bulk orders created:
   1. #1665  (id: 6901234567890)
   2. #1666  (id: 6901234567891)
   ...
Total: 25/25 orders created
```

---

### Use inside a test (beforeAll)

```ts
import ShopifyOrderUploader from '../../src/helpers/createOrder';

test.beforeAll(async ({ request }) => {
  const uploader = new ShopifyOrderUploader(request);

  // Clone from existing order:
  const { names, ids } = await uploader.uploadBulkOrdersFromExisting(
    '6888460681264',  // order ID from URL
    10,               // number of copies
  );

  // OR — fresh orders:
  const { names, ids } = await uploader.uploadBulkOrders(10);

  console.log('Created:', names); // ["#1665", "#1666", ...]
});
```

---

### Environment variables for bulk orders

| Variable | Required | Default | Description |
|---|---|---|---|
| `TEMPLATE_ORDER_ID` | No | — | Shopify order ID to clone. If not set, creates fresh orders. |
| `ORDER_COUNT` | No | `5` | Number of orders to create |
| `ORDER_DELAY_MS` | No | `1000` | Delay between orders in ms (avoid rate limiting) |
| `STORE` | Yes | — | Shopify store name (same as other tests) |
| `SHOPIFY_ACCESS_TOKEN` | Yes | — | Admin API token (same as other tests) |
| `SHOPIFY_API_VERSION` | Yes | — | API version e.g. `2026-01` (same as other tests) |
