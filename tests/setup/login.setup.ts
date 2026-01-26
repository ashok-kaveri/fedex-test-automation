import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import { CaptchaHandler } from '../helpers/captchaHandler';

const store = process.env.STORE;
const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;
const STORAGE_PATH = './auth.json';

setup('Write login session data', async ({ page }) => {
  setup.setTimeout(180000); // 3 minutes for login including potential CAPTCHA
  
  // Check if auth.json exists and is valid
  if(fs.existsSync(STORAGE_PATH) && fs.statSync(STORAGE_PATH).size > 0 ) {
    console.log('✅ Login session file exists, verifying if still valid...');
    
    try {
      // Try to use existing session
      const context = await page.context().browser()?.newContext({ storageState: STORAGE_PATH });
      if (context) {
        const testPage = await context.newPage();
        await testPage.goto(`https://admin.shopify.com/store/${store}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Check if we're still logged in (not redirected to login page)
        const currentUrl = testPage.url();
        await testPage.close();
        await context.close();
        
        if (currentUrl.includes('admin.shopify.com/store/')) {
          console.log('✅ Session is still valid, reusing existing auth.json');
          return;
        } else {
          console.log('⚠️ Session expired, need to login again...');
          fs.unlinkSync(STORAGE_PATH);
        }
      }
    } catch (e) {
      console.log('⚠️ Session validation failed, need to login again...');
      if (fs.existsSync(STORAGE_PATH)) {
        fs.unlinkSync(STORAGE_PATH);
      }
    }
  }  
  
  console.log('🔐 Performing fresh login and saving storage state...');
  
  await page.goto(`https://admin.shopify.com/store/${store}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Try to find and click account card if it exists
  const accountCard = page.locator(`text="${userEmail}"`);
  try {
    await accountCard.waitFor({ state: 'visible', timeout: 5000 });
    await accountCard.click();
    console.log('Clicked on existing account card');
  } catch (e) {
    console.log('No account card found, proceeding with email entry');
  }
  
  // Check if email is already filled or needs to be entered
  const emailInput = page.locator('#account_email');
  const continueBtn = page.locator('button:has-text("Continue with email")');
  
  // Check if we're on the email entry page or already at password page
  const emailInputVisible = await emailInput.isVisible().catch(() => false);
  const continueBtnVisible = await continueBtn.isVisible().catch(() => false);
  
  if (emailInputVisible && continueBtnVisible) {
    // We're on email entry page
    console.log('📧 Entering email...');
    await emailInput.fill(userEmail || '');
    await continueBtn.click();
    
    // Wait for next page
    console.log('⏳ Waiting for next page...');
    await page.waitForTimeout(3000);
    
    // Handle CAPTCHA if present
    const captchaHandler = new CaptchaHandler(page);
    const hadCaptcha = await captchaHandler.handleCaptchaIfPresent('Continue with email', 120000);
    
    if (hadCaptcha) {
      console.log('✅ CAPTCHA was solved and handled');
    }
  } else {
    console.log('✅ Email already filled, password field is ready');
  }
  
  // Fill password - wait for password field to be visible
  console.log('🔍 Waiting for password field...');
  const passwordInput = page.locator('#account_password');
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
  
  // Wait a bit for field to be ready
  await page.waitForTimeout(1000);
  
  // Click and fill password
  console.log('📝 Entering password...');
  await passwordInput.click();
  await page.waitForTimeout(300);
  await passwordInput.fill(userPassword || '');
  
  // Verify password was entered
  await page.waitForTimeout(300);
  const passwordValue = await passwordInput.inputValue();
  console.log(`📝 Password entered (length: ${passwordValue.length})`);
  
  if (passwordValue.length === 0) {
    console.log('⚠️ Retrying password entry...');
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
  console.log('🔘 Clicking Log in button...');
  const loginBtn = page.locator('button[type="submit"]:has-text("Log in")');
  await loginBtn.click();
  
  console.log('⏳ Waiting for login to complete...');
  
  // Wait a bit for any error messages or navigation
  await page.waitForTimeout(3000);
  
  // Check for error messages
  const errorMsg = page.locator('.ui-error-message, .errors, [role="alert"]');
  const errorCount = await errorMsg.count();
  if (errorCount > 0) {
    const errorText = await errorMsg.first().textContent();
    console.log(`❌ Login error detected: ${errorText}`);
    await page.screenshot({ path: 'login-error.png', fullPage: true });
    throw new Error(`Login failed: ${errorText}`);
  }
  
  // Wait for navigation to complete with longer timeout
  try {
    await page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 60000 });
    console.log('✅ Navigated to Shopify admin successfully');
  } catch (e) {
    console.log(`Current URL: ${page.url()}`);
    await page.screenshot({ path: 'login-timeout.png', fullPage: true });
    console.log('⚠️ Navigation timeout - checking if already logged in...');
    
    // Check if we're already on admin page
    if (page.url().includes('admin.shopify.com')) {
      console.log('✅ Already on Shopify admin page');
    } else {
      throw e;
    }
  }
  
  // Save session
  await page.context().storageState({ path: STORAGE_PATH });
  console.log('✅ Login successful, session saved');
});
