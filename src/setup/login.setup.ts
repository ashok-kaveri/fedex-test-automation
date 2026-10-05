import { test as setup, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import { CaptchaHandler } from '../helpers/captchaHandler';
import { ShopifyAccountSelectorPage } from '../pages/shopify/ShopifyAccountSelectorPage';

const store = process.env.STORE;
const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;
const STORAGE_PATH = './auth.json';

// Login page locators as simple functions

// Each login step also carries an off-screen copy of the field it isn't asking for (e.g. a
// password input on the email step) for password managers. Playwright counts that copy as
// visible, so skip fields inside the aria-hidden wrapper Shopify puts around it.
function getLoginField(page: Page, id: string): Locator {
  return page.locator(`#${id}:not([aria-hidden="true"] *)`);
}

function getEmailInput(page: Page): Locator {
  return getLoginField(page, 'account_email');
}

function getContinueWithEmailButton(page: Page): Locator {
  return page.locator('button:has-text("Continue with email")');
}

function getPasswordInput(page: Page): Locator {
  return getLoginField(page, 'account_password');
}

function getLoginButton(page: Page): Locator {
  return page.locator('button[type="submit"]:has-text("Log in")');
}

function getErrorMessage(page: Page): Locator {
  return page.locator('.ui-error-message, .errors, [role="alert"]');
}

// The admin session lives in these cookies; without one, admin.shopify.com redirects to
// the login page and every test fails on a locator timeout instead of on a clear auth
// error. Shopify retired koa.sid and no longer leaves an accounts.shopify.com
// _identity_session in the saved state; the admin session is now _merchant_essential.
const REQUIRED_COOKIES = ['_merchant_essential'];
const EXPIRY_MARGIN_SECONDS = 5 * 60;

function getStoredSessionProblem(): string | null {
  if (!fs.existsSync(STORAGE_PATH) || fs.statSync(STORAGE_PATH).size === 0) {
    return 'no session file';
  }

  let cookies: Array<{ name: string; expires: number }>;
  try {
    cookies = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8')).cookies ?? [];
  } catch {
    return 'session file is not valid JSON';
  }

  const cutoff = Date.now() / 1000 + EXPIRY_MARGIN_SECONDS;

  for (const name of REQUIRED_COOKIES) {
    const cookie = cookies.find((c) => c.name === name);
    if (!cookie) return `session cookie ${name} is missing`;
    // expires <= 0 marks a browser-session cookie, which survives storageState reuse.
    if (cookie.expires > 0 && cookie.expires < cutoff) {
      return `session cookie ${name} expired on ${new Date(cookie.expires * 1000).toISOString()}`;
    }
  }

  return null;
}

// A substring check on the URL is not enough: the login page carries
// return_to=https://admin.shopify.com/... in its query string, and Cloudflare shows its
// "Just a moment..." challenge on the admin URL itself before the real page loads.
async function isOnAdmin(page: Page): Promise<boolean> {
  const url = new URL(page.url());
  if (url.hostname !== 'admin.shopify.com' || !url.pathname.startsWith('/store/')) return false;
  const title = await page.title().catch(() => '');
  return title.length > 0 && !title.includes('Just a moment');
}

async function saveSession(page: Page): Promise<void> {
  await page.context().storageState({ path: STORAGE_PATH });
  const problem = getStoredSessionProblem();
  if (problem) {
    throw new Error(`Reached admin but the saved session is unusable: ${problem}`);
  }
}

setup('Write login session data', async ({ browser, headless }) => {
  setup.setTimeout(300000); // 5 minutes for login including CAPTCHA / 2FA

  // Cookie expiry no longer says whether the session is live (_merchant_essential is
  // issued for a year), so load the admin with whatever auth.json holds. If the admin
  // opens, the session is good and the refreshed cookies are saved; if Shopify sends it
  // to the login page instead, the login loop takes over from there.
  const sessionProblem = getStoredSessionProblem();
  console.log(sessionProblem ? `🔐 Performing login (${sessionProblem})...` : '🔍 Checking saved session...');

  const canSeed = sessionProblem !== 'no session file' && sessionProblem !== 'session file is not valid JSON';
  const context = await browser.newContext(canSeed ? { storageState: STORAGE_PATH } : {});
  const page = await context.newPage();

  try {
    await login(page, headless);
  } finally {
    await context.close();
  }
});

// Text Shopify shows on its 2FA step ("Check your phone", authenticator code, etc.).
function getVerificationPrompt(page: Page): Locator {
  return page
    .getByText(/check your phone|verification code|authentication code|two-step|2-step/i)
    .first();
}

async function getVisibleError(page: Page): Promise<string | null> {
  const errors = getErrorMessage(page);
  const count = await errors.count();
  for (let i = 0; i < count; i++) {
    const error = errors.nth(i);
    if (!(await error.isVisible().catch(() => false))) continue;
    const text = (await error.textContent().catch(() => ''))?.trim();
    if (text) return text;
  }
  return null;
}

async function fillPassword(page: Page): Promise<void> {
  const passwordInput = getPasswordInput(page);
  await passwordInput.click();
  await passwordInput.fill(userPassword || '');

  if ((await passwordInput.inputValue()).length === 0) {
    await passwordInput.click();
    await passwordInput.pressSequentially(userPassword || '', { delay: 50 });

    if ((await passwordInput.inputValue()).length === 0) {
      await page.screenshot({ path: 'password-entry-failed.png', fullPage: true });
      throw new Error('Failed to enter password');
    }
  }
}

const LOGIN_TIMEOUT_MS = 240000;

/**
 * Shopify decides per attempt which screens to show (Cloudflare check, account picker,
 * email, password, CAPTCHA, 2FA) and in what order, so instead of a fixed script this
 * polls, reacts to whichever screen is up, and stops once the admin has loaded.
 *
 * CAPTCHA and 2FA are deliberately not automated: in --headed mode the run pauses for a
 * person to complete them in the browser window and then carries on by itself.
 */
async function login(page: Page, headless: boolean): Promise<void> {
  await page.goto(`https://admin.shopify.com/store/${store}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const accountSelector = new ShopifyAccountSelectorPage(page);
  const captchaHandler = new CaptchaHandler(page);
  const emailInput = getEmailInput(page);
  const continueWithEmailButton = getContinueWithEmailButton(page);
  const passwordInput = getPasswordInput(page);
  const loginButton = getLoginButton(page);

  // Each step is submitted once; after a person finishes a CAPTCHA the steps are
  // re-armed, because Shopify then expects the interrupted step to be submitted again.
  const done = new Set<string>();
  let waitingForPerson = false;
  const deadline = Date.now() + LOGIN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await isOnAdmin(page)) {
      await saveSession(page);
      console.log('✅ Admin reached, session saved');
      return;
    }

    const captchaVisible = await captchaHandler.isCaptchaPresent();
    const verificationVisible = await getVerificationPrompt(page).isVisible().catch(() => false);
    if (captchaVisible || verificationVisible) {
      const what = captchaVisible ? 'CAPTCHA' : '2FA code';
      if (headless) {
        await page.screenshot({ path: 'login-timeout.png', fullPage: true });
        throw new Error(
          `Shopify is asking for a ${what}, which needs a person. ` +
            'Re-run with: npx playwright test --project="setup" --headed',
        );
      }
      if (!waitingForPerson) {
        console.log(`⏳ Shopify is asking for a ${what} — complete it in the browser window; the setup continues on its own.`);
        waitingForPerson = true;
      }
      await page.waitForTimeout(2000);
      continue;
    }
    if (waitingForPerson) {
      console.log('✅ Manual step completed, continuing login');
      waitingForPerson = false;
      done.clear();
    }

    const error = await getVisibleError(page);
    if (error) {
      await page.screenshot({ path: 'login-error.png', fullPage: true });
      throw new Error(`Login failed: ${error}`);
    }

    if (!done.has('account') && (await accountSelector.heading.isVisible().catch(() => false))) {
      console.log(`Selecting account ${userEmail}`);
      await accountSelector.getAccountCardByEmail(userEmail || '').click();
      done.add('account');
    } else if (!done.has('password') && (await passwordInput.isVisible().catch(() => false))) {
      console.log('Entering password');
      await fillPassword(page);
      await loginButton.click();
      done.add('password');
    } else if (
      !done.has('email') &&
      (await emailInput.isVisible().catch(() => false)) &&
      (await continueWithEmailButton.isVisible().catch(() => false))
    ) {
      console.log('Entering email');
      await emailInput.fill(userEmail || '');
      await continueWithEmailButton.click();
      done.add('email');
    }

    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'login-timeout.png', fullPage: true });
  throw new Error(`Login did not reach the Shopify admin within ${LOGIN_TIMEOUT_MS / 1000}s; stuck on ${page.url()}`);
}
