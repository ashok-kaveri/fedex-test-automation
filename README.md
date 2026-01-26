# FedEx Test Automation - Manual Label Generation

Playwright-based test automation for FedEx Shopify app using Page Object Model (POM) and OOP principles.

## Project Structure

```
tests/
├── pages/              # Page Object Model classes
│   ├── BasePage.ts            # Base class with common methods
│   ├── ShopifyAdminPage.ts    # Shopify admin interactions
│   └── FedExAppPage.ts        # Manual label generation page
├── helpers/            # Reusable utilities
│   ├── captchaHandler.ts      # CAPTCHA detection and handling
│   └── createOrder.ts         # Order creation helper
├── setup/              # Test setup
│   └── login.setup.ts         # Authentication with session reuse
└── suites/             # Test suites
    └── smoke/
        └── singleShipmentFlow.spec.ts  # End-to-end manual label flow
```

## Architecture

### BasePage
Base class providing common functionality for all page objects:
- Navigation helpers
- Element interaction utilities (click, fill, wait)
- Iframe handling
- Reusable wait methods

### ShopifyAdminPage
Handles Shopify admin portal interactions:
- Store navigation
- Order search and selection (with 3-retry logic)
- Menu navigation
- Opening manual label generation page

### FedExAppPage
Manages FedEx app **manual label generation page** (iframe) interactions:
- Manual package generation
- Shipping rate retrieval with retry logic (3 attempts)
- XML error extraction from FedEx API responses
- Dynamic first service selection
- Manual label generation
- Navigation to Orders page
- Pickup requests
- Order search within app (with 3-retry logic)
- Status verification

### CaptchaHandler
Utility for CAPTCHA detection and manual solving:
- Visibility-based detection for reCAPTCHA and hCAPTCHA
- Wait for manual CAPTCHA solving
- Integrated into login flow

## Test Suite: Manual Label Generation Flow

**7 tests in serial mode** covering the complete manual label generation workflow in a single browser window:

1. **Navigate to Shopify order** - Search and open order with retry logic
2. **Generate packages manually** - Create packages in manual page
3. **Get shipping rates and select first service** - Retrieve rates, select first available service
4. **Generate manual label** - Create label and verify success
5. **Verify order in Orders table** - Search order after label generation
6. **Request pickup** - Select order and request pickup
7. **Verify pickup details** - Open and verify pickup information

### Test Execution
- **Serial mode**: All tests run sequentially in a single browser window
- **Shared page**: Browser context and page created once in `beforeAll`, reused across all tests
- **Single order**: Order created once in `beforeAll`, processed through all 7 tests
- **Session reuse**: Uses `auth.json` for authentication, avoiding repeated logins

## Key Features

### ✅ Retry Logic
- **Shipping rates**: 3 attempts with automatic retry button click
- **Order search (Shopify)**: 3 attempts with 2s delays (handles newly created orders)
- **Order search (App)**: 3 attempts with 2s delays (handles sync delays)
- **XML error extraction**: Extracts FedEx API errors when rates fail
- Descriptive error messages with attempt counts

### ✅ CAPTCHA Handling
- Automatic detection of reCAPTCHA and hCAPTCHA
- Visibility-based detection
- Waits for manual solving
- Integrated into login flow

### ✅ Session Management
- Validates `auth.json` before tests
- Reuses authentication across test runs
- Smart login detection (email vs password page)

### ✅ Optimized Timeouts
Reduced wait times by ~30-40% while maintaining reliability:
- Most operations: 5-10s (previously 10-15s)
- Removed all arbitrary `waitForTimeout()` calls
- Smart waiting based on element visibility

### ✅ POM/OOP Benefits
- **Reusability**: Page methods used across multiple tests
- **Maintainability**: UI changes updated in one place
- **Readability**: Tests read like user actions
- **Type Safety**: Full TypeScript support

## Usage Example

```typescript
import { ShopifyAdminPage } from '../../pages/ShopifyAdminPage';
import { FedExAppPage } from '../../pages/FedExAppPage';

test('Generate manual label', async () => {
  const shopifyAdmin = new ShopifyAdminPage(sharedPage);
  const fedexApp = new FedExAppPage(sharedPage);

  // Navigate to order
  await shopifyAdmin.navigateToStore(store);
  await shopifyAdmin.searchAndOpenOrder(orderID, 3);
  await shopifyAdmin.openMoreActions();
  await shopifyAdmin.openManualLabelPage();

  // Manual label generation with retry
  await fedexApp.verifyOrderHeading(orderID);
  await fedexApp.generatePackagesManually();
  await fedexApp.getShippingRates(3); // 3 retries
  await fedexApp.selectFirstShippingService();
  await fedexApp.generateManualLabel();
  await fedexApp.verifyManualLabelGenerated();
});
```

## Running Tests

```bash
# Run smoke tests (recommended)
npm run test:smoke

# Run all tests
npx playwright test

# Run specific test
npx playwright test -g "Generate packages manually"

# Debug mode
npx playwright test --debug

# View HTML report
npx playwright show-report
```

## Key Features

- **Single Window Execution**: All tests run in one browser window using shared page pattern
- **Serial Test Mode**: Tests execute sequentially with maintained state
- **Smart Retry Logic**: 3-attempt retry for shipping rates and order searches
- **CAPTCHA Support**: Automatic detection with manual solving workflow
- **Session Reuse**: Validates and reuses `auth.json` to avoid repeated logins
- **XML Error Parsing**: Extracts detailed FedEx API errors when operations fail
- **Dynamic Service Selection**: Selects first available shipping service (not hardcoded)
- **Page Object Model**: Clean separation of concerns with reusable page classes
- **TypeScript**: Full type safety and IntelliSense support

## Benefits of This Architecture

- **Separation of Concerns**: Test logic separate from page interactions
- **DRY Principle**: No code duplication with reusable page methods
- **Maintainability**: UI changes updated in one place
- **Type Safety**: Full TypeScript support prevents runtime errors
- **Better Debugging**: Know exactly which step failed with descriptive logs
- **Session Efficiency**: Reuse authentication across runs
- **Resilient**: Retry logic handles timing and sync issues
