---
name: fedex-debug-skill
description: >
  Debugging guide for the FedEx Shopify App Playwright+TypeScript test automation project.
  Use this skill whenever a test is failing, flaky, timing out, or throwing errors in this project.
  Trigger when the user says "test is failing", "why is X broken", "fix this error", "test hangs",
  "timeout error", "element not found", "order not created", "rates not loading", or pastes any
  Playwright error from this project. Also trigger when asked to add retry logic or improve reliability.
---

# FedEx Test Automation — Debug Skill

## How to Use This Skill

1. Identify the failure category from the error/symptom below
2. Follow the matching diagnosis steps
3. Apply the fix pattern

---

## Failure Category Index

| Symptom | Category |
|---|---|
| Test hangs at Shopify login | [A. Auth / Login Failures](#a-auth--login-failures) |
| `auth.json` stale or missing | [A. Auth / Login Failures](#a-auth--login-failures) |
| `Order upload failed` / order not created | [B. Order Creation (API) Failures](#b-order-creation-api-failures) |
| Element not found inside iframe | [C. Iframe Interaction Failures](#c-iframe-interaction-failures) |
| `Failed to fetch rates` / shipping rates error | [D. Shipping Rates Failures](#d-shipping-rates-failures) |
| Order not found in search / not in grid | [E. Order Search & Grid Failures](#e-order-search--grid-failures) |
| Label not generated / timeout on label | [F. Label Generation & Download Failures](#f-label-generation--download-failures) |
| Toast message not visible | [G. Toast / UI Assertion Failures](#g-toast--ui-assertion-failures) |
| Generic timeout / element never visible | [H. Timeout Failures](#h-timeout-failures) |
| Login works but tests still fail | [I. Session / Auth State Failures](#i-session--auth-state-failures) |

---

## A. Auth / Login Failures

### Symptom
- Test hangs at Shopify admin login page
- `Timeout waiting for "Continue with email" button`
- Screenshots created: `login-error.png`, `login-timeout.png`, `password-entry-failed.png`

### Root Causes & Fixes

**CAPTCHA appeared:**
- The `CaptchaHandler` pauses up to 120 seconds for manual solving
- Open the headed browser window and solve the CAPTCHA manually
- Run setup in headed mode: `npx playwright test --project="setup" --headed`

**Password field not filling:**
- Shopify sometimes ignores `.fill()` on password input
- Fix is already in code (`pressSequentially` with 50ms delay in `login.setup.ts`)
- If still failing: increase delay or add explicit focus before fill

**Account selector not handled:**
- Shopify shows a "Choose account" screen for multi-account users
- `login.setup.ts` detects this and selects by email — verify `USER_EMAIL` env var is correct

**`auth.json` corrupted or empty:**
```bash
rm auth.json
npx playwright test --project="setup" --headed
```

---

## B. Order Creation (API) Failures

### Symptom
- `beforeAll` fails with: `Order upload failed: ...`
- `expect(sharedOrderID).toBeTruthy()` fails
- `No product config found for store: <name>`

### Root Causes & Fixes

**Missing/wrong STORE env var:**
```bash
# Check .env file
STORE=kee-fedex-qa   # must match a key in testData/products/productsconfig.json
```

**Invalid access token:**
```bash
# .env file
SHOPIFY_ACCESS_TOKEN=shpat_...   # must be a valid, non-expired token
```

**Product not in config:**
- Open `testData/products/productsconfig.json`
- Verify the store key exists and has entries for the product type you're using (`simple`, `variable`, `dangerous`, `digital`)

**API version mismatch:**
```bash
SHOPIFY_API_VERSION=2023-01   # update in .env if Shopify deprecated this version
```

**Shopify rate limiting:**
- No retry is built into `ShopifyOrderUploader` — add a delay and retry:
```typescript
// Quick manual retry pattern in beforeAll
let sharedOrderID: string | null = null;
for (let i = 0; i < 3; i++) {
  sharedOrderID = (await orderUploader.uploadOrder()) as string;
  if (sharedOrderID) break;
  await new Promise(r => setTimeout(r, 3000));
}
expect(sharedOrderID).toBeTruthy();
```

---

## C. Iframe Interaction Failures

### Symptom
- `Error: locator.click: Element not found`
- Element exists on page visually but Playwright can't find it
- `strict mode violation` — multiple elements matched

### Root Cause
The FedEx app runs inside `iframe[name="app-iframe"]`. Locating elements via `page.locator()` or `page.getByRole()` won't reach inside the iframe.

### Fix
Always use `this.appFrame` in page objects (never `this.page`) for app content:

```typescript
// ❌ Wrong — targets the main page, misses iframe content
this.page.getByRole('button', { name: 'Get Rates' })

// ✅ Correct — targets inside the iframe
this.appFrame.getByRole('button', { name: 'Get Rates' })
```

In `BasePage`:
```typescript
this.appFrame = AppFrameHelper.getAppFrame(page);
// Use this.appFrame for all FedEx app elements
// Use this.page for Shopify admin elements (outside iframe)
```

**iframe not loaded yet:**
```typescript
// Wait for iframe to appear before interacting
await this.page.locator('iframe[name="app-iframe"]').waitFor({ state: 'attached' });
```

---

## D. Shipping Rates Failures

### Symptom
- Red error box: `"Failed to fetch rates"`
- Test throws: `Failed to get shipping rates after 5 attempts`
- Retry button keeps appearing

### Root Causes & Fixes

**Invalid address combination:**
- FedEx doesn't support all origin→destination pairs
- Check the order's shipping address matches a supported country
- Default test address is US (`addressconfig.json` → `default`)

**Package dimensions/weight issue:**
- FedEx rejects packages with invalid or zero dimensions
- Verify the product has weight set in Shopify
- Check `ManualLabelPage` package input values

**FedEx API temporarily down:**
- The retry logic (`ManualLabelPage.getShippingRates`) retries up to 5 times with 2s delays
- If it fails all 5 times, extract the XML error from the thrown message:
```
Failed to fetch rates: [XML error details here]
```
- Use the XML error code to diagnose the exact FedEx API issue

**Increasing retry attempts temporarily:**
```typescript
// In your test, call with more retries
await pages.manualLabelPage.getShippingRates(10); // default is 5
```

---

## E. Order Search & Grid Failures

### Symptom
- `Order #XXXX not found after 4 attempts`
- Order appears in Shopify but not in FedEx app grid
- Order status column stuck on old value

### Root Causes & Fixes

**Order not synced to FedEx app yet:**
- The app polls for new orders; there can be a 5-10s delay
- `ShippingPage.searchOrderWithRetries()` retries 3 times with 2s waits — may need more:
```typescript
await pages.shippingPage.searchOrderWithRetries(orderId, 6); // increase retries
```

**Shopify admin search index lag:**
- `ShopifyAdminPage.searchAndOpenOrder()` retries 4 times
- Increase wait between retries if store is slow to index

**Order grid column not updating:**
- `orderGridColumnValidation()` polls up to 10 times, refreshing the page
- If still stuck, check that the label was actually generated (check `OrderSummaryPage`)
- A "unexpected value" error means the column shows something it shouldn't — log the actual value and compare

---

## F. Label Generation & Download Failures

### Symptom
- Test times out at `generateLabelInApp()` (70s timeout)
- `waitForEvent('download')` never resolves
- PDF text extraction returns empty string

### Root Causes & Fixes

**Label generation timeout (70s):**
- Check that shipping rates loaded successfully first (prerequisite)
- If rates loaded but label generation hangs, it's usually a FedEx API issue
- Enable trace: `npx playwright test --trace on` and inspect the trace

**PDF download never fires:**
- The code uses `Promise.all([page.waitForEvent('download'), triggerAction()])`
- If `triggerAction` doesn't open the PDF viewer, the download never fires
- Add a check that the label URL page actually opened before triggering download

**PDF text extraction empty:**
- `basePage.getLabelRequestLog()` fetches the PDF via axios and uses `pdf-parse`
- Common cause: the URL has expired or requires authentication
- Check `documentUrl` is not empty before parsing

**Log ZIP download issues:**
- `downloadLogs()` clicks a button and waits for download
- If the button is inside iframe, ensure `appFrame` locator is used

---

## G. Toast / UI Assertion Failures

### Symptom
- `expect(locator).toBeVisible()` timeout on toast
- Toast appears visually but test times out

### Root Cause
Toasts in the FedEx app are transient — they appear briefly and disappear. Playwright's default assertion polling may miss them.

### Fix

**Increase toast timeout:**
```typescript
// basePage.expectToast() uses 7s — if needed, call directly:
await expect(this.appFrame.getByText('Label created')).toBeVisible({ timeout: 15000 });
```

**Exact text match required:**
- `expectToast('Updated')` is case-sensitive and exact
- If the toast says "Settings updated" use the full string: `expectToast('Settings updated')`

**Toast appears before assertion:**
- Move the `expectToast` call directly after the triggering action with no `await` in between

---

## H. Timeout Failures

### Standard Timeouts Reference

| Operation | Default Timeout | Where Set |
|---|---|---|
| Login completion | 60s | `login.setup.ts` |
| CAPTCHA manual solve | 120s | `captchaHandler.ts` |
| Shipping rates per attempt | 10s | `ManualLabelPage` |
| Label generation | 70s | `OrderSummaryPage` |
| Toast message | 7s | `basePage.ts` |
| Network idle cap | 5s | `basePage.ts` |
| Loading spinner hide | 10s | `basePage.ts` |
| Per-test default | 60–120s | set via `test.setTimeout()` |

### Fix Pattern

**Increase per-test timeout:**
```typescript
test('3. Generate label', async ({ pages }) => {
  test.setTimeout(180000); // 3 minutes for slow environments
  ...
});
```

**Element never appearing (not timing out, just absent):**
- Check the iframe issue (Section C) first
- Check if a loading spinner is still showing: call `await pages.shippingPage.waitForLoadingToComplete()`
- Use headed mode to see what's actually on screen: `npm run test:headed`

**Debugging a specific timeout:**
```bash
npx playwright test tests/label_generation/manualLabelGeneration.spec.ts --headed --debug
```

---

## I. Session / Auth State Failures

### Symptom
- Login succeeds but tests get redirected to login page mid-run
- `auth.json` exists but tests still fail to authenticate

### Root Causes & Fixes

**Session expired:**
- Shopify sessions expire after inactivity
- Delete `auth.json` and re-run setup:
```bash
rm auth.json
npx playwright test --project="setup" --headed
```

**Wrong storage state loaded:**
- `playwright.config.ts` sets `storageState: './auth.json'` globally
- Verify this path is correct relative to your working directory

**Multiple browsers clobbering session:**
- Config runs Chrome, Safari, Firefox all with same `auth.json`
- If one browser invalidates the session, others fail
- Run only Chrome for debugging: `npx playwright test --project="Google Chrome"`

---

## Quick Debug Commands

```bash
# Run a single failing test in headed mode
npx playwright test tests/<path>.spec.ts --headed

# Run with step-by-step debugger
npx playwright test tests/<path>.spec.ts --debug

# Run with trace enabled (inspect in Playwright UI)
npx playwright test tests/<path>.spec.ts --trace on
npx playwright show-trace test-results/<test>/trace.zip

# Regenerate auth.json (if login is broken)
rm auth.json && npx playwright test --project="setup" --headed

# Run only smoke tests
npm run test:smoke

# Run specific test by title
npx playwright test -g "Manual Label Generation"

# Show last HTML report
npm run show-report
```

---

## Reading Failure Logs

The project uses emoji-prefixed console logs to make scanning easy:

| Emoji | Meaning |
|---|---|
| ✅ | Success / step passed |
| ⚠️ | Warning / retry attempt |
| 🔄 | Retry in progress |
| ❌ | Hard failure |
| 🚀 | Action starting |

When a test fails, read the console output top-to-bottom and find the first `❌` — that's the root cause. Everything after is cascading failure.

---

## Common Error Messages → Root Cause Map

| Error Message | Root Cause |
|---|---|
| `No product config found for store: X` | `STORE` env var wrong or missing from `productsconfig.json` |
| `Order X not found after N attempts` | Order not synced yet or wrong order ID |
| `Failed to fetch rates after 5 attempts` | FedEx API issue or invalid address/dimensions |
| `Timeout 70000ms exceeded` on label | Shipping rates didn't load or FedEx API slow |
| `locator.click: strict mode violation` | Multiple elements matched — make locator more specific |
| `locator.waitFor: Timeout` on app element | Forgot to use `appFrame` instead of `page` |
| `expect(sharedOrderID).toBeTruthy()` | `uploadOrder()` returned null — API call failed |
| `CAPTCHA detected` | Run setup headed and solve manually |
| `password-entry-failed.png` created | Password input not ready — add focus or delay |
