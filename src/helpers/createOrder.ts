import * as dotenv from 'dotenv';
import axios from 'axios';
import type { APIRequestContext } from '@playwright/test';
import productConfigJson from '../../testData/products/productsconfig.json';
import { StoreProducts, Product } from '../config/product.types';
import addressConfigJson from '../../testData/products/addressconfig.json';
import { Address, AddressKey } from '../../src/config/address.types';

const ADDRESS_CONFIG = addressConfigJson as Record<AddressKey, Address>;

const PRODUCT_CONFIG = productConfigJson as Record<string, StoreProducts>;
dotenv.config({ quiet: true });

// ENV
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '';
const SHOPIFY_STORE_NAME = process.env.STORE || '';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

// PRODUCTS
const STORE_PRODUCTS = PRODUCT_CONFIG[SHOPIFY_STORE_NAME];
if (!STORE_PRODUCTS) {
  throw new Error(`No product config found for store: ${SHOPIFY_STORE_NAME}`);
}

const SIMPLE_PRODUCTS = STORE_PRODUCTS.simple || [];
const VARIABLE_PRODUCTS = STORE_PRODUCTS.variable || [];
const DIGITAL_PRODUCTS = STORE_PRODUCTS.digital || [];
const DANGEROUS_PRODUCTS = STORE_PRODUCTS.dangerous || [];

// TYPES
interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    countryCode: string;
    zip: string;
  };
}

interface LineItem {
  title?: string;
  price?: string;
  quantity: number;
  requires_shipping?: boolean;
  product_id?: number;
  variant_id?: number;
}

type ProductRequest = {
  productType: 'variable' | 'simple' | 'digital' | 'dangerous';
  productIndexes?: number[];
  quantities?: number[];
};

class ShopifyOrderUploader {
  private readonly apiUrl: string;
  private readonly baseUrl: string;
  private lastOrderId: string | null = null;
  private apiContext?: APIRequestContext;

  constructor(apiContext?: APIRequestContext) {
    this.baseUrl = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}`;
    this.apiUrl  = `${this.baseUrl}/orders.json`;
    this.apiContext = apiContext;
  }

  // ======================
  // PUBLIC METHODS
  // ======================

  public async uploadOrder(addressKey: AddressKey = 'default'): Promise<string | null> {
    const user = this.getDefaultUser(addressKey);
    const items = this.getLineItems();
    return this.upload(user, items, `Order (${addressKey})`);
  }

  public async uploadOrderWithMultipleProducts(productRequests?: ProductRequest[], addressKey: AddressKey = 'default'): Promise<string | null> {
    const user = this.getDefaultUser(addressKey);
    const items = this.getMultipleLineItems(productRequests);
    return this.upload(user, items, `Multi Product Order (${addressKey})`);
  }

  /**
   * Fetch an existing Shopify order by ID and return the fields needed to
   * clone it (line_items, addresses, customer, email).
   *
   * This replaces the manual step of opening the browser, adding .json to the
   * order URL, and copying the response. Just pass the numeric order ID and
   * you get the template back ready to use with uploadBulkOrdersFromExisting().
   *
   * @param orderId  Shopify numeric order ID (from the URL or order list)
   * @returns        Cloneable order payload, or null if the fetch fails.
   *
   * @example
   *   const template = await uploader.fetchOrderTemplate('6888460681264');
   */
  public async fetchOrderTemplate(orderId: string): Promise<Record<string, unknown> | null> {
    const url = `${this.baseUrl}/orders/${orderId}.json`;
    try {
      let raw: unknown;
      if (this.apiContext) {
        const res = await this.apiContext.get(url, {
          headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
        });
        if (!res.ok()) {
          console.error(`fetchOrderTemplate: GET ${url} → ${res.status()}`);
          return null;
        }
        raw = await res.json();
      } else {
        const { data } = await axios.get(url, {
          headers: { 'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN },
        });
        raw = data;
      }

      const order = (raw as { order: Record<string, unknown> }).order;
      // Extract only the fields Shopify needs when creating a new order.
      // Omit read-only fields (id, created_at, etc.) that would cause 422 errors.
      return {
        email:            order.email,
        customer:         order.customer,
        line_items:       (order.line_items as Array<Record<string, unknown>>)?.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity:   item.quantity,
        })),
        billing_address:  order.billing_address,
        shipping_address: order.shipping_address,
      };
    } catch (err: unknown) {
      const error = err as { response?: { data: unknown }; message?: string };
      console.error('fetchOrderTemplate failed:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * The NEW AUTOMATED VERSION of the shopify-actions bulk flow.
   *
   * Old manual flow:
   *   1. Open browser → find order → add .json to URL → copy JSON
   *   2. Paste into shopify-actions config.json
   *   3. npm start → create orders → type count → wait 15s each
   *
   * New automated flow (this method):
   *   const { names } = await uploader.uploadBulkOrdersFromExisting('6888460681264', 25);
   *   // Done — 25 cloned orders created in ~25 seconds (1s delay each)
   *
   * @param templateOrderId  Numeric Shopify order ID to clone
   *                         (visible in the URL: /orders/6888460681264)
   * @param count            How many copies to create
   * @param delayMs          Delay between orders in ms (default 1000ms)
   *
   * @returns { names, ids } — order names like ["#1665","#1666"] and numeric IDs
   *
   * @example
   *   const uploader = new ShopifyOrderUploader(request);
   *   const { names } = await uploader.uploadBulkOrdersFromExisting('6888460681264', 10);
   *   console.log('Created:', names); // ["#1665", "#1666", ...]
   */
  public async uploadBulkOrdersFromExisting(
    templateOrderId: string,
    count: number,
    delayMs: number = 15000,
  ): Promise<{ names: string[]; ids: string[] }> {
    // Step 1: Fetch the template — replaces the manual browser .json step
    console.log(`[ShopifyOrderUploader] Fetching template from order #${templateOrderId}…`);
    const template = await this.fetchOrderTemplate(templateOrderId);

    if (!template) {
      console.error(`[ShopifyOrderUploader] Could not fetch template order ${templateOrderId}`);
      return { names: [], ids: [] };
    }

    // Step 2: Clone it N times — replaces npm start → create orders → count
    const names: string[] = [];
    const ids:   string[] = [];
    console.log(`[ShopifyOrderUploader] Creating ${count} clones of order #${templateOrderId}…`);

    for (let i = 0; i < count; i++) {
      const result = await this.postOrderWithRetry(
        { order: template },
        `Clone ${i + 1}/${count}`,
      );

      if (result) {
        names.push(result.name);
        ids.push(result.id);
        this.lastOrderId = result.id;
        console.log(`[ShopifyOrderUploader] ${i + 1}/${count} → ${result.name}`);
      } else {
        // All retries exhausted — bucket is still throttled.
        // Wait 30s to let it recover before attempting the next order.
        console.warn(`[ShopifyOrderUploader] ⚠️  Clone ${i + 1} failed — waiting 30s for bucket to recover…`);
        await new Promise<void>(resolve => setTimeout(resolve, 30_000));
        continue; // skip the normal delayMs — recovery wait was already longer
      }

      if (i < count - 1) {
        if (result.hadThrottle) {
          // We just recovered from a 429 — give the bucket extra breathing room
          // before the next request, otherwise the pattern repeats immediately.
          console.log(`[ShopifyOrderUploader] ⏸  Post-throttle cooldown 15s…`);
          await new Promise<void>(resolve => setTimeout(resolve, 15_000));
        } else if (delayMs > 0) {
          await new Promise<void>(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.log(`[ShopifyOrderUploader] Done: ${names.length}/${count} cloned → ${names.join(', ')}`);
    return { names, ids };
  }

  /**
   * Create N orders in sequence via the Shopify Admin API.
   *
   * Use this for "bulk buy" test cases where you need multiple orders in the
   * FedEx app without clicking through the storefront UI each time.
   *
   * @param count     Number of orders to create.
   * @param options   addressKey   — address template to use (default | UK | CA)
   *                  productRequests — which products / quantities per order
   *                  delayMs     — ms to wait between orders (default 1000ms)
   *                                Set to 0 only if your store has no rate limit.
   *
   * @returns { names: string[], ids: string[] }
   *   names  — Shopify order names, e.g. ["#1001", "#1002"]
   *   ids    — internal Shopify order IDs (useful for direct API lookups)
   *
   * @example
   *   const uploader = new ShopifyOrderUploader(request);
   *   const { names } = await uploader.uploadBulkOrders(5, { addressKey: 'UK' });
   *   console.log('Created orders:', names);
   */
  public async uploadBulkOrders(
    count: number,
    options?: {
      addressKey?: AddressKey;
      productRequests?: ProductRequest[];
      delayMs?: number;
    },
  ): Promise<{ names: string[]; ids: string[] }> {
    const { addressKey = 'default', productRequests, delayMs = 1000 } = options ?? {};
    const names: string[] = [];
    const ids:   string[] = [];

    console.log(`[ShopifyOrderUploader] Creating ${count} orders via Shopify API…`);

    for (let i = 0; i < count; i++) {
      const user  = this.getDefaultUser(addressKey);
      const items = productRequests
        ? this.getMultipleLineItems(productRequests)
        : this.getLineItems();

      const name = await this.upload(user, items, `Bulk Order ${i + 1}/${count} (${addressKey})`);

      if (name) {
        names.push(name);
        if (this.lastOrderId) ids.push(this.lastOrderId);
      }

      // Wait between requests — avoids Shopify rate-limiting (429).
      // Skip the delay after the final order.
      if (i < count - 1 && delayMs > 0) {
        await new Promise<void>(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`[ShopifyOrderUploader] Bulk done: ${names.length}/${count} orders created → ${names.join(', ')}`);
    return { names, ids };
  }

  public getLastOrderId(): string | null {
    return this.lastOrderId;
  }

  // ======================
  // CORE
  // ======================

  /**
   * POST to Shopify orders API with automatic 429 retry.
   *
   * Shopify REST rate limit: 2 req/sec sustained (leaky bucket of 40).
   * On 429 the response includes a `Retry-After` header (seconds to wait).
   * We honour that header and retry up to `maxRetries` times before giving up.
   *
   * Also logs the bucket level (`X-Shopify-Shop-Api-Call-Limit`) so you can
   * spot if you're approaching the limit during a long bulk run.
   */
  private async postOrderWithRetry(
    payload: Record<string, unknown>,
    label: string,
    maxRetries = 5,
  ): Promise<{ name: string; id: string; hadThrottle: boolean } | null> {
    const headers = {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    };

    let hadThrottle = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.apiContext) {
          const res = await this.apiContext.post(this.apiUrl, { headers, data: payload });

          // Log bucket level so we can spot if we're getting close
          const callLimit = res.headers()['x-shopify-shop-api-call-limit'];
          if (callLimit) {
            const [used, max] = callLimit.split('/').map(Number);
            if (used / max > 0.8) {
              console.warn(`[ShopifyOrderUploader] ⚠️  Bucket at ${used}/${max}`);
            }
          }

          if (res.status() === 429) {
            hadThrottle = true;
            // Exponential backoff: attempt 1=10s, 2=20s, 3=30s…
            // Flat Retry-After alone (~10s) is not enough — the bucket needs ~60s to drain
            // when Shopify Admin background calls keep it near capacity.
            const retryAfter = Number(res.headers()['retry-after'] ?? 10);
            const waitMs = retryAfter * attempt * 1000;
            console.warn(
              `[ShopifyOrderUploader] 429 on ${label} (attempt ${attempt}/${maxRetries}) — waiting ${waitMs / 1000}s…`,
            );
            await new Promise<void>(resolve => setTimeout(resolve, waitMs));
            continue;
          }

          if (!res.ok()) {
            // Non-429 HTTP error — log and bail (don't retry, e.g. 422 Unprocessable Entity)
            console.error(`${label} failed → HTTP ${res.status()}`);
            return null;
          }

          const data = await res.json();
          return { name: data.order.name, id: String(data.order.id), hadThrottle };

        } else {
          const { data, headers: resHeaders } = await axios.post(this.apiUrl, payload, { headers });

          const callLimit = resHeaders['x-shopify-shop-api-call-limit'] as string | undefined;
          if (callLimit) {
            const [used, max] = callLimit.split('/').map(Number);
            if (used / max > 0.8) {
              console.warn(`[ShopifyOrderUploader] ⚠️  Bucket at ${used}/${max}`);
            }
          }

          return { name: data.order.name, id: String(data.order.id), hadThrottle };
        }
      } catch (err: unknown) {
        const error = err as { response?: { status: number; headers: Record<string, string>; data: unknown }; message?: string };

        if (error.response?.status === 429) {
          hadThrottle = true;
          const retryAfter = Number(error.response.headers['retry-after'] ?? 10);
          const waitMs = retryAfter * attempt * 1000;
          console.warn(
            `[ShopifyOrderUploader] 429 on ${label} (attempt ${attempt}/${maxRetries}) — waiting ${waitMs / 1000}s…`,
          );
          await new Promise<void>(resolve => setTimeout(resolve, waitMs));
          continue;
        }

        // Retry on network errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED, etc.)
        const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EPIPE'];
        const isNetworkError = networkErrors.some(code => error.message?.includes(code));
        if (isNetworkError && attempt < maxRetries) {
          console.warn(`[ShopifyOrderUploader] Network error on ${label} (attempt ${attempt}/${maxRetries}) — ${error.message} — retrying in 5s…`);
          await new Promise<void>(resolve => setTimeout(resolve, 5_000));
          continue;
        }

        console.error(`${label} failed:`, error.response?.data ?? error.message);
        return null;
      }
    }

    console.error(`${label} — gave up after ${maxRetries} retries (all returned 429)`);
    return null;
  }

  private async upload(user: User, lineItems: LineItem[], label: string): Promise<string | null> {
    const payload = {
      order: {
        email: user.email,
        line_items: lineItems,
        customer: this.getCustomer(user),
        billing_address: this.getAddress(user),
        shipping_address: this.getAddress(user),
      },
    };

    const result = await this.postOrderWithRetry(payload, label);
    if (!result) return null;
    this.lastOrderId = result.id;
    return result.name; // hadThrottle not needed for single-order callers
  }

  // ======================
  // PRODUCTS
  // ======================

  private getLineItems(): LineItem[] {
    const first = SIMPLE_PRODUCTS[0];

    return [
      {
        product_id: first.product_id,
        variant_id: first.variant_id,
        quantity: 1,
      },
    ];
  }

  private getMultipleLineItems(productRequests?: ProductRequest[]): LineItem[] {
    if (!productRequests?.length) return this.getLineItems();

    const items: LineItem[] = [];

    for (const req of productRequests) {
      let list: Product[] = [];

      switch (req.productType) {
        case 'simple':
          list = SIMPLE_PRODUCTS;
          break;
        case 'variable':
          list = VARIABLE_PRODUCTS;
          break;
        case 'digital':
          list = DIGITAL_PRODUCTS;
          break;
        case 'dangerous':
          list = DANGEROUS_PRODUCTS;
          break;
      }

      const indexes = req.productIndexes ?? list.map((_, i) => i);

      indexes.forEach((i, idx) => {
        const p = list[i];
        if (!p) return;

        items.push({
          product_id: p.product_id,
          variant_id: p.variant_id,
          quantity: req.quantities?.[idx] ?? 1,
        });
      });
    }

    return items;
  }

  // ======================
  // USER
  // ======================

  private getDefaultUser(addressKey: AddressKey = 'default'): User {
    const addr = ADDRESS_CONFIG[addressKey];

    return {
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@example.com',
      phone: '1234567890',
      address: addr,
    };
  }

  private getAddress(user: User) {
    return {
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
      address1: user.address.street,
      city: user.address.city,
      province: user.address.state,
      country: user.address.countryCode,
      zip: user.address.zip,
    };
  }

  private getCustomer(user: User) {
    return {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
    };
  }
}

export default ShopifyOrderUploader;
