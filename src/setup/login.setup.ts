import { test as setup, expect, Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import { CaptchaHandler } from '../helpers/captchaHandler';
import { ShopifyAccountSelectorPage } from '../pages/shopify/ShopifyAccountSelectorPage';

const store = process.env.STORE;
const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;
const STORAGE_PATH = './auth.json';

// Login page locators as simple functions
function getEmailInput(page: Page): Locator {
  return page.locator('#account_email');
}

function getContinueWithEmailButton(page: Page): Locator {
  return page.locator('button:has-text("Continue with email")');
}

function getPasswordInput(page: Page): Locator {
  return page.locator('#account_password');
}

function getLoginButton(page: Page): Locator {
  return page.locator('button[type="submit"]:has-text("Log in")');
}

function getErrorMessage(page: Page): Locator {
  return page.locator('.ui-error-message, .errors, [role="alert"]');
}

setup('Write login session data', async ({ page }) => {
  setup.setTimeout(180000); // 3 minutes for login including potential CAPTCHA
  
  // Check if auth.json exists and is valid
  if(fs.existsSync(STORAGE_PATH) && fs.statSync(STORAGE_PATH).size > 0 ) {
    console.log('✅ Session file exists, reusing auth.json');
    return;
  }
  
  console.log('🔐 Performing login...');
  
  await page.goto(`https://admin.shopify.com/store/${store}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // Check if account selector page appears
  const accountSelector = new ShopifyAccountSelectorPage(page);
  const accountPageVisible = await accountSelector.isAccountSelectionPageVisible();
  
  if (accountPageVisible) {
    await accountSelector.selectAccountByText(userEmail || '');
    await page.waitForTimeout(5000);
    
    if (page.url().includes('admin.shopify.com/store/')) {
      await page.context().storageState({ path: STORAGE_PATH });
      console.log('✅ Login successful via account selection');
      return;
    }
  }
  
  // Initialize login page locators
  const emailInput = getEmailInput(page);
  const continueWithEmailButton = getContinueWithEmailButton(page);
  const passwordInput = getPasswordInput(page);
  const loginButton = getLoginButton(page);
  const errorMessage = getErrorMessage(page);
  
  // Check if email is already filled or needs to be entered
  const emailInputVisible = await emailInput.isVisible().catch(() => false);
  const continueBtnVisible = await continueWithEmailButton.isVisible().catch(() => false);
  
  if (emailInputVisible && continueBtnVisible) {
    await emailInput.fill(userEmail || '');
    await continueWithEmailButton.click();
    await page.waitForTimeout(3000);
    
    // Handle CAPTCHA if present
    const captchaHandler = new CaptchaHandler(page);
    await captchaHandler.handleCaptchaIfPresent('Continue with email', 120000);
  }
  
  // Fill password
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000);
  
  await passwordInput.click();
  await page.waitForTimeout(300);
  await passwordInput.fill(userPassword || '');
  await page.waitForTimeout(300);
  
  const passwordValue = await passwordInput.inputValue();
  
  if (passwordValue.length === 0) {
    await passwordInput.click();
    await page.waitForTimeout(500);
    await passwordInput.pressSequentially(userPassword || '', { delay: 50 });
    
    const retryValue = await passwordInput.inputValue();
    if (retryValue.length === 0) {
      await page.screenshot({ path: 'password-entry-failed.png', fullPage: true });
      throw new Error('Failed to enter password');
    }
  }
  
  // Click the Log in button
  await loginButton.click();
  await page.waitForTimeout(3000);
  
  // Check for error messages
  const errorCount = await errorMessage.count();
  if (errorCount > 0) {
    const errorText = await errorMessage.first().textContent();
    await page.screenshot({ path: 'login-error.png', fullPage: true });
    throw new Error(`Login failed: ${errorText}`);
  }
  
  // Wait for navigation to complete
  try {
    await page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 60000 });
  } catch (e) {
    if (!page.url().includes('admin.shopify.com')) {
      await page.screenshot({ path: 'login-timeout.png', fullPage: true });
      throw e;
    }
  }
  
  // Save session
  await page.context().storageState({ path: STORAGE_PATH });
  console.log('✅ Login successful, session saved');
});
