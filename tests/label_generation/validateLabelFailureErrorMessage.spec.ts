import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

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

  async function createOrderWithCity(city: string): Promise<{ orderName: string; orderId: string }> {
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

  async function verifyShortCityAutoLabelFailure(
    pages: { labelFailureValidations: any; shopifyAdmin: any },
    orderName: string,
    city: string,
  ): Promise<void> {
    await pages.labelFailureValidations.triggerAutoGenerateLabelUntilFailed(
      pages.shopifyAdmin,
      store,
      orderName,
    );

    await pages.labelFailureValidations.openOrderFailureMessage(orderName);
    const failureInfo = await pages.labelFailureValidations.getFailureDialogDetails();

    expect(failureInfo.code).toBe('CITY.TOO.SHORT');
    expect(failureInfo.message).toContain('City name is too short. Please provide the full city name.');
    expect(failureInfo.resolution).toContain('support@pluginhive.com');

    await pages.labelFailureValidations.openRequestResponseXmlView();
    const { request, response } = await pages.labelFailureValidations.getRequestResponsePayload();

    const requestedShipment = (request.requestObject as Record<string, unknown>)?.requestedShipment as Record<string, unknown>;
    const recipients = requestedShipment?.recipients as Array<Record<string, unknown>> | undefined;
    const address =
      (recipients?.[0]?.address as Record<string, unknown> | undefined) ??
      ((requestedShipment?.recipient as Record<string, unknown> | undefined)?.address as Record<string, unknown> | undefined);
    const responsePayload = response.jsonResponse as Record<string, unknown>;
    const errors = responsePayload?.errors as Array<Record<string, unknown>>;

    expect(address?.city).toBe(city);
    expect(address?.postalCode).toBe('GU21 2MY');
    expect(address?.countryCode).toBe('GB');
    expect(response.status).toBe(400);
    expect(errors?.[0]?.code).toBe('CITY.TOO.SHORT');
  }

  async function verifyValidCityAutoLabelSuccess(
    pages: { labelFailureValidations: any; shopifyAdmin: any },
    orderName: string,
  ): Promise<void> {
    await pages.labelFailureValidations.triggerAutoGenerateLabelUntilStatus(
      pages.shopifyAdmin,
      store,
      orderName,
      'label generated',
    );

    await pages.labelFailureValidations.openShippingGrid();
    const rowText = await pages.labelFailureValidations.waitForOrderToReachStatus(orderName, 'label generated', 10);

    expect(rowText).toContain('label generated');
    expect(rowText).not.toContain('failed');
  }

  test('Verify 2-character city auto-label failure modal and request payload', async ({ pages }) => {
    test.setTimeout(180000);
    const { orderName } = await createOrderWithCity('LN');

    await verifyShortCityAutoLabelFailure(pages, orderName, 'LN');
  });

  test('Verify 1-character city auto-label failure modal and request payload', async ({ pages }) => {
    test.setTimeout(180000);
    const { orderName } = await createOrderWithCity('L');

    await verifyShortCityAutoLabelFailure(pages, orderName, 'L');
  });

  test('Verify city longer than 3 characters does not fail auto-label generation', async ({ pages }) => {
    test.setTimeout(180000);
    const { orderName } = await createOrderWithCity('London');

    await verifyValidCityAutoLabelSuccess(pages, orderName);
  });
});
