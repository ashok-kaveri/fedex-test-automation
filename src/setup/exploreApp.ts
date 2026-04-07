/**
 * exploreApp.ts — UI Explorer for automation code generation
 *
 * Runs as a Playwright test under the 'explore' project.
 * Uses existing auth.json + BasePage/appFrame infrastructure.
 *
 * Called by Python Chrome Agent:
 *   EXPLORE_APP_PATH=settings/additional-services \
 *   EXPLORE_OUTPUT=/tmp/explore_result.json \
 *   npx playwright test src/setup/exploreApp.ts --project=explore
 *
 * Outputs JSON: { error, elements, steps }
 */

import { test } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { AppFrameHelper } from '../helpers/appFrameHelper';

// Ensure .env is loaded (playwright.config.ts loads it too, but be explicit)
dotenv.config();

const APP_PATH   = process.env.EXPLORE_APP_PATH  || '';
const OUTPUT     = process.env.EXPLORE_OUTPUT    || '/tmp/explore_result.json';
const STORE      = process.env.STORE             || '';

function writeResult(data: { error: string | null; elements: string[]; steps: string[]; app_url?: string }) {
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf8');
}

test('Explore app UI for code generation', async ({ page }) => {
  const steps: string[]    = [];
  const elements: string[] = [];

  if (!STORE) {
    writeResult({ error: 'STORE not set in .env — add STORE=your-store to the automation repo .env', elements: [], steps });
    return;
  }

  const store   = STORE.trim().endsWith('.myshopify.com') ? STORE.trim() : `${STORE.trim()}.myshopify.com`;
  const appBase = `https://${store}/admin/apps/fedex-shipping`;
  const appUrl  = APP_PATH ? `${appBase}/${APP_PATH}` : appBase;

  steps.push(`Navigating to ${appUrl}`);
  await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  // Use existing AppFrameHelper — same as all POMs
  const appFrame = AppFrameHelper.getAppFrame(page);

  // Check iframe is present
  const iframeCount = await page.locator('iframe[name="app-iframe"]').count();
  if (iframeCount === 0) {
    const url = page.url();
    const msg = (url.includes('login') || url.includes('account'))
      ? 'Session expired — delete auth.json and run: npx playwright test --project=setup'
      : `App iframe not found at ${url}`;
    writeResult({ error: msg, elements: [], steps, app_url: appUrl });
    return;
  }

  steps.push('App iframe found — capturing elements');

  // Capture interactive elements using same role-based approach as POMs
  const roles: Array<{ role: Parameters<typeof appFrame.getByRole>[0]; label: string }> = [
    { role: 'heading',  label: 'heading'  },
    { role: 'button',   label: 'button'   },
    { role: 'checkbox', label: 'checkbox' },
    { role: 'textbox',  label: 'input'    },
    { role: 'switch',   label: 'toggle'   },
    { role: 'tab',      label: 'tab'      },
    { role: 'combobox', label: 'select'   },
    { role: 'link',     label: 'link'     },
  ];

  for (const { role, label } of roles) {
    try {
      const locator = appFrame.getByRole(role);
      const count   = await locator.count();
      for (let i = 0; i < Math.min(count, 20); i++) {
        try {
          const el      = locator.nth(i);
          const ariaLbl = await el.getAttribute('aria-label').catch(() => null);
          const text    = await el.textContent().catch(() => null);
          const name    = (ariaLbl || text || '').trim().slice(0, 80);
          if (!name) continue;

          let entry = `${label}: '${name}'`;

          const checked = await el.getAttribute('aria-checked').catch(() => null);
          if (checked !== null) entry += ` [checked=${checked}]`;

          const val = await el.inputValue().catch(() => null);
          if (val) entry += ` [value='${val}']`;

          elements.push(entry);
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  steps.push(`Captured ${elements.length} elements`);
  writeResult({ error: null, elements, steps, app_url: appUrl });
});
