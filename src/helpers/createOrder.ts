import * as dotenv from 'dotenv';
import axios from 'axios';
import type { APIRequestContext } from '@playwright/test';
import { PRODUCT_CONFIG, Product } from '../config/products.config';
import { ADDRESS_CONFIG } from '../config/address.config';

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
  private lastOrderId: string | null = null;
  private apiContext?: APIRequestContext;

  constructor(apiContext?: APIRequestContext) {
    this.apiUrl = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/orders.json`;
    this.apiContext = apiContext;
  }

  // ======================
  // PUBLIC METHODS
  // ======================

  public async uploadOrder(addressKey: string = 'default'): Promise<string | null> {
    const user = this.getDefaultUser(addressKey);
    const items = this.getLineItems();
    return this.upload(user, items, `Order (${addressKey})`);
  }

  public async uploadOrderWithMultipleProducts(productRequests?: ProductRequest[], addressKey: string = 'default'): Promise<string | null> {
    const user = this.getDefaultUser(addressKey);
    const items = this.getMultipleLineItems(productRequests);
    return this.upload(user, items, `Multi Product Order (${addressKey})`);
  }

  public getLastOrderId(): string | null {
    return this.lastOrderId;
  }

  // ======================
  // CORE
  // ======================

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

    try {
      if (this.apiContext) {
        const response = await this.apiContext.post(this.apiUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          },
          data: payload,
        });

        if (!response.ok()) {
          console.error(`${label} failed`);
          return null;
        }

        const data = await response.json();
        this.lastOrderId = data.order.id;
        return data.order.name;
      } else {
        const { data } = await axios.post(this.apiUrl, payload, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        this.lastOrderId = data.order.id;
        return data.order.name;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data: unknown }; message?: string };
      console.error(`${label} failed:`, error.response?.data || error.message);
      return null;
    }
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

  private getDefaultUser(addressKey: string): User {
    const addr = ADDRESS_CONFIG[addressKey] || ADDRESS_CONFIG.default;

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
