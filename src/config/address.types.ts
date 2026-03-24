export type Address = {
  street: string;
  city: string;
  state: string;
  countryCode: string;
  zip: string;
};

export type AddressKey = 'default' | 'UK' | 'CA';
