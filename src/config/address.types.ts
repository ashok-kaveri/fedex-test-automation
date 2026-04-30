export type Address = {
  street: string;
  city: string;
  state: string;
  countryCode: string;
  zip: string;
  residential?: boolean;
};

export type AddressKey = 'default' | 'UK' | 'CA';
