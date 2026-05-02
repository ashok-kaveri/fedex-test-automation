import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';
import { createOrderWithCity } from '../helpers/orderFactory';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

test.describe('Validate label failure error message', { tag: '@regression' }, () => {
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();
  });

  test('Verify 2-character city auto-label failure modal and request payload', async ({ pages }) => {
    test.setTimeout(180000);
    const { orderName } = await createOrderWithCity(orderUploader, 'LN');

    await pages.labelFailureValidations.verifyShortCityAutoLabelFailure(
      pages.shopifyAdmin,
      store,
      orderName,
      'LN',
    );
  });

  test('Verify 1-character city auto-label failure modal and request payload', async ({ pages }) => {
    test.setTimeout(180000);
    const { orderName } = await createOrderWithCity(orderUploader, 'L');

    await pages.labelFailureValidations.verifyShortCityAutoLabelFailure(
      pages.shopifyAdmin,
      store,
      orderName,
      'L',
    );
  });

  test('Verify city longer than 3 characters does not fail auto-label generation', async ({ pages }) => {
    test.setTimeout(180000);
    const { orderName } = await createOrderWithCity(orderUploader, 'London');

    await pages.labelFailureValidations.verifyValidCityAutoLabelSuccess(
      pages.shopifyAdmin,
      store,
      orderName,
    );
  });
});
