export type Product = {
  product_id: number;
  variant_id: number;
};

export type StoreProducts = {
  simple: Product[];
  variable: Product[];
  digital: Product[];
  dangerous?: Product[];
};

export const PRODUCT_CONFIG: Record<string, StoreProducts> = {
  'fedex-rest-automation-inder': {
    simple: [
      { product_id: 7924798947376, variant_id: 42845809147952 },
      { product_id: 7924798849072, variant_id: 42845808984112 },
    ],
    variable: [
      { product_id: 7924798914608, variant_id: 42845809049648 },
      { product_id: 7924798816304, variant_id: 42845808918576 },
    ],
    digital: [{ product_id: 7924798980144, variant_id: 42845809180720 }],
    dangerous: [],
  },

  'rest-fedex-new': {
    simple: [{ product_id: 9885163323678, variant_id: 50214246187294 }],

    variable: [
      { product_id: 10115422552377, variant_id: 51930438074681 },
      { product_id: 10115422716217, variant_id: 51930438861113 },
    ],

    digital: [
      { product_id: 10115422847289, variant_id: 51930439090489 },
      { product_id: 10115422912825, variant_id: 51930439156025 },
    ],

    dangerous: [],
  },
};
