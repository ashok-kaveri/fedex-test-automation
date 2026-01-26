# FedEx Test Automation

End-to-end test automation for FedEx Shopify App using Playwright and TypeScript.

## Quick Start

```bash
# Install dependencies
npm install
npx playwright install chromium

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Run tests
npx playwright test
npx playwright test --headed  # See browser
npx playwright show-report    # View results
```

## Project Structure

```
tests/
├── pages/              # Page Object Model
│   ├── BasePage.ts
│   ├── ShopifyAdminPage.ts
│   └── FedExAppPage.ts
├── helpers/            # Utilities
│   ├── captchaHandler.ts
│   └── createOrder.ts
├── setup/              # Authentication
│   └── login.setup.ts
└── suites/             # Test suites
    └── label_generation/
```

## Features

- **Page Object Model** - Maintainable test structure
- **Retry Logic** - Auto-retry for flaky operations (3 attempts)
- **CAPTCHA Handling** - Manual solving support
- **Session Reuse** - Faster test execution with auth.json
- **Serial Execution** - Single browser for complete workflows
- **TypeScript** - Full type safety

## Test Suite: Manual Label Generation

5 tests covering the complete workflow:

1. Navigate to Shopify order
2. Generate packages
3. Select shipping service
4. Generate label
5. Verify order in table

All tests run sequentially in a single browser window using a shared order.

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

## Troubleshooting

**CAPTCHA appears** - Solve manually, test continues automatically

**Session expired** - Delete `auth.json` to force fresh login

**Rates fail** - Check FedEx API error in XML viewer

**Order not found** - Retry logic handles sync delays (3 attempts)

---

Maintained by PluginHive QA Team
