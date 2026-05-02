import { expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

export async function createOrderWithCity(
  orderUploader: ShopifyOrderUploader,
  city: string,
): Promise<{ orderName: string; orderId: string }> {
  const orderName = await orderUploader.uploadOrderWithAddresses({
    shippingAddress: {
      street: '2 Guildford Road',
      city,
      state: 'Surrey',
      countryCode: 'GB',
      zip: 'GU21 2MY',
      residential: false,
    },
    billingAddress: {
      street: '10 York Road',
      city: 'Bristol',
      state: 'Bristol',
      countryCode: 'GB',
      zip: 'BS1 5TY',
    },
    productRequests: [{ productType: 'simple', productIndexes: [1], quantities: [1] }],
  });

  expect(orderName).toBeTruthy();
  const createdOrderName = orderName as string;
  const createdOrderId = String(orderUploader.getLastOrderId());

  expect(createdOrderId).toBeTruthy();
  console.log(`Created order: ${createdOrderName} (${createdOrderId})`);

  return {
    orderName: createdOrderName,
    orderId: createdOrderId,
  };
}
