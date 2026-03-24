export type ProductType = 'simple' | 'variable' | 'digital' | 'dangerous';

export type Product = {
  product_id: number;
  variant_id: number;
};
export type ProductInput = {
  name: string;
  type: ProductType;
};

export type ShopifyProductResponse = {
  product: {
    id: number;
    variants: {
      id: number;
    }[];
  };
};

export type StoreProducts = Record<ProductType, Product[]>;
