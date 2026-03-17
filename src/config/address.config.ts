export type Address = {
  street: string;
  city: string;
  state: string;
  countryCode: string;
  zip: string;
};

export const ADDRESS_CONFIG: Record<string, Address> = {
  default: {
    street: '123 Main St',
    city: 'Los Angeles',
    state: 'CA',
    countryCode: 'US',
    zip: '90001',
  },

  UK: {
    street: '221B Baker Street',
    city: 'London',
    state: 'London',
    countryCode: 'GB',
    zip: 'NW1 6XE',
  },

  CA: {
    street: '111 Wellington St',
    city: 'Ottawa',
    state: 'ON',
    countryCode: 'CA',
    zip: 'K1A 0A9',
  },
};
