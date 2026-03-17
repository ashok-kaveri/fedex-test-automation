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
npx playwright test tests/suites/label_generation/manualLabelGeneration.spec.ts --project="Google Chrome" --headed
```

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
