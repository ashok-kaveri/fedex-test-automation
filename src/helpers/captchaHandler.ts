import { Page } from '@playwright/test';

/**
 * CAPTCHA Handler Helper
 * Handles reCAPTCHA detection and manual solving for Shopify login
 */
export class CaptchaHandler {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Check if CAPTCHA is present AND visible on the page
   */
  async isCaptchaPresent(): Promise<boolean> {
    // Check for reCAPTCHA or hCAPTCHA iframes that are visible
    const captchaIframes = this.page.locator('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[title*="reCAPTCHA"], iframe[title*="hCaptcha"]');
    const count = await captchaIframes.count();
    
    if (count === 0) {
      return false;
    }
    
    // Check if any CAPTCHA iframe is actually visible
    for (let i = 0; i < count; i++) {
      const isVisible = await captchaIframes.nth(i).isVisible().catch(() => false);
      if (isVisible) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Wait for manual CAPTCHA solving with timeout
   * @param timeoutMs - Maximum time to wait for CAPTCHA solving (default: 120000ms = 2 minutes)
   * @param continueButtonText - Text of the button to check if enabled after CAPTCHA
   */
  async waitForCaptchaSolving(timeoutMs: number = 120000, continueButtonText: string = 'Continue with email'): Promise<void> {
    console.log('CAPTCHA detected! Please solve it manually...');
    console.log(`Waiting up to ${timeoutMs / 1000} seconds for manual CAPTCHA resolution...`);
    console.log('After solving CAPTCHA, Playwright will automatically continue');

    const submitBtn = this.page.locator(`button:has-text("${continueButtonText}")`);

    // Wait for button to be enabled (CAPTCHA verified)
    let isEnabled = false;
    const startTime = Date.now();
    
    while (!isEnabled && (Date.now() - startTime) < timeoutMs) {
      isEnabled = await submitBtn.isEnabled();
      if (!isEnabled) {
        await this.page.waitForTimeout(2000);
      } else {
        console.log('CAPTCHA verified! Button is now enabled.');
      }
    }

    if (!isEnabled) {
      throw new Error(`CAPTCHA was not verified within ${timeoutMs / 1000} seconds`);
    }
  }

  /**
   * Handle CAPTCHA if present - check, wait for solving, and click continue
   * @param continueButtonText - Text of the button to click after CAPTCHA solving
   * @param timeoutMs - Maximum time to wait for CAPTCHA solving
   */
  async handleCaptchaIfPresent(continueButtonText: string = 'Continue with email', timeoutMs: number = 120000): Promise<boolean> {
    console.log('Checking for CAPTCHA...');
    const captchaExists = await this.isCaptchaPresent();

    if (captchaExists) {
      // Wait for manual CAPTCHA solving
      await this.waitForCaptchaSolving(timeoutMs, continueButtonText);

      // Click continue button after CAPTCHA to proceed
      console.log(`Clicking "${continueButtonText}" button after CAPTCHA...`);
      const submitBtn = this.page.locator(`button:has-text("${continueButtonText}")`);
      await submitBtn.click();

      // Wait for next step to load
      await this.page.waitForTimeout(2000);
      
      return true; // CAPTCHA was present and handled
    } else {
      console.log('No CAPTCHA detected, proceeding...');
      return false; // No CAPTCHA present
    }
  }
}
