import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "";
const SHOPIFY_STORE_NAME = process.env.STORE || "";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";

// ✅ Helper to parse address JSON from .env
function parseAddress(envKey: string) {
  const raw = process.env[envKey];
  return raw ? Object.assign({}, ...JSON.parse(raw)) : {};
}

// ✅ Load multiple addresses
const defaultAddress = parseAddress("SHIPPING_ADDRESS_JSON");
const domesticAddress = parseAddress("DOMESTIC_ADDRESS_JSON");
const internationalAddress = parseAddress("INTERNATIONAL_ADDRESS_JSON");

// ✅ Products parsing
let SIMPLE_PRODUCTS: { product_id: number; variant_id: number }[] = [];
let VARIABLE_PRODUCTS: { product_id: number; variant_id: number }[] = [];
let DIGITAL_PRODUCTS: { product_id: number; variant_id: number }[] = [];
let DANGEROUS_PRODUCTS: { product_id: number; variant_id: number }[] = [];

interface Product {
  product_id: string | number;
  variant_id: string | number;
  quantity?: number;
}
type ProductRequest = {
  productType: "variable" | "simple" | "digital" | "dangerous";
  productCount?: number;
  quantities?: number[];
};

try {
  SIMPLE_PRODUCTS = process.env.SIMPLE_PRODUCTS_JSON
    ? JSON.parse(process.env.SIMPLE_PRODUCTS_JSON)
    : [];
  VARIABLE_PRODUCTS = process.env.VARIABLE_PRODUCTS_JSON
    ? JSON.parse(process.env.VARIABLE_PRODUCTS_JSON)
    : [];
  DIGITAL_PRODUCTS = process.env.DIGITAL_PRODUCTS_JSON
    ? JSON.parse(process.env.DIGITAL_PRODUCTS_JSON)
    : [];
  DANGEROUS_PRODUCTS = process.env.DANGEROUS_PRODUCTS_JSON
    ? JSON.parse(process.env.DANGEROUS_PRODUCTS_JSON)
    : [];
} catch (e) {
  console.error("Invalid PRODUCTS_JSON format in .env");
}

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

class ShopifyOrderUploader {
  private readonly apiUrl: string;
  private lastOrderId: string | null = null;

  constructor() {
    this.apiUrl = `https://${SHOPIFY_STORE_NAME}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/orders.json`;
  }

  // Standard order with address type selection
  public async uploadOrder(
    productCount: any = null,
    quantity: any = [],
    addressType: "default" | "domestic" | "international" = "default"
  ): Promise<string | null> {
    const user = this.getDefaultUser(addressType);
    const items = this.getLineItems();
    return this.upload(user, items, `Standard Order (${addressType})`);
  }

  public async uploadOrderWithShippingCustomProduct(
    addressType: "default" | "domestic" | "international" = "default"
  ): Promise<string | null> {
    const user = this.getDefaultUser(addressType);
    const items = this.getLineItemsWithCustomProduct({
      requires_shipping: true,
    });
    return this.upload(user, items, "Custom Product (with shipping)");
  }

  public async uploadOrderWithNonShippingCustomProduct(
    addressType: "default" | "domestic" | "international" = "default"
  ): Promise<string | null> {
    const user = this.getDefaultUser(addressType);
    const items = this.getLineItemsWithCustomProduct({
      requires_shipping: false,
    });
    return this.upload(user, items, "Custom Product (no shipping)");
  }


  public async uploadOrderWithMultipleProducts(
    productRequests?: ProductRequest[],
    addressType: "default" | "domestic" | "international" = "default"
  ): Promise<string | null> {
    const user = this.getDefaultUser(addressType);
    const items = this.getMultipleLineItems(productRequests);
    return this.upload(user, items, `Standard Order (${addressType})`);
  }

  public getLastOrderId(): string | null {
    return this.lastOrderId;
  }

  private async upload(
    user: User,
    lineItems: LineItem[],
    label: string
  ): Promise<string | null> {
    const payload = this.buildOrderPayload(user, lineItems);
    try {
      const { data } = await axios.post(this.apiUrl, payload, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      });
      this.lastOrderId = data.order.id;
      return data.order.name;
    } catch (err: any) {
      console.error(
        `${label} creation failed:`,
        err.response?.data || err.message
      );
      return null;
    }
  }

  private buildOrderPayload(user: User, lineItems: LineItem[]) {
    return {
      order: {
        email: user.email,
        line_items: lineItems,
        customer: this.getCustomer(user),
        billing_address: this.getAddress(user),
        shipping_address: this.getAddress(user),
      },
    };
  }

  private getLineItems(): LineItem[] {
    const firstProduct = SIMPLE_PRODUCTS[0];
    return [
      {
        product_id: Number(firstProduct.product_id),
        variant_id: Number(firstProduct.variant_id),
        quantity: 1,
      },
    ];
  }

  private getMultipleLineItems(productRequests?: ProductRequest[]): LineItem[] {
    if (!productRequests || productRequests.length === 0) {
      return this.getLineItems();
    }

    const selectedProducts: Product[] = [];

    for (const req of productRequests) {
      let productList: Product[] = [];

      switch (req.productType) {
        case "variable":
          productList = VARIABLE_PRODUCTS;
          break;
        case "simple":
          productList = SIMPLE_PRODUCTS;
          break;
        case "digital":
          productList = DIGITAL_PRODUCTS;
          break;
        case "dangerous":
          productList = DANGEROUS_PRODUCTS;
          break;

        default:
          console.warn(`Unknown product type: ${req.productType}`);
          continue;
      }

      const products = req.productCount
        ? productList.slice(0, req.productCount)
        : productList;
      products.forEach((product, idx) => {
        selectedProducts.push({
          ...product,
          quantity: req.quantities?.[idx] ?? 1,
        });
      });
    }

    return selectedProducts.map((item) => ({
      product_id: Number(item.product_id),
      variant_id: Number(item.variant_id),
      quantity: item.quantity ?? 1,
    }));
  }

  private getLineItemsWithCustomProduct(customConfig: {
    requires_shipping: boolean;
  }): LineItem[] {
    const catalogItems = this.getLineItems();
    const customItem: LineItem = {
      title: "Custom Product",
      price: "9.99",
      quantity: 1,
      requires_shipping: customConfig.requires_shipping,
    };
    return [...catalogItems, customItem];
  }

  private getDefaultUser(
    addressType: "default" | "domestic" | "international"
  ): User {
    let chosenAddress;

    switch (addressType) {
      case "domestic":
        chosenAddress = domesticAddress;
        break;
      case "international":
        chosenAddress = internationalAddress;
        break;
      default:
        chosenAddress = defaultAddress;
    }

    return {
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      phone: "1234567890",
      address: {
        street: chosenAddress.street || "",
        city: chosenAddress.city || "",
        state: chosenAddress.state || "",
        countryCode: chosenAddress.countryCode || "",
        zip: chosenAddress.zip || "",
      },
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



