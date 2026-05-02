import { test, expect } from '../../src/setup/fixtures';
import ShopifyOrderUploader from '../../src/helpers/createOrder';

const store = process.env.STORE;

if (!store) {
  throw new Error('STORE environment variable is required');
}

test.describe.configure({ mode: 'serial' });

async function triggerAutoGenerateLabelWithRetry(pages: any, storeName: string, orderName: string) {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt === 1) {
        await pages.shopifyAdmin.navigateToStore(storeName);
        await pages.shopifyAdmin.searchAndOpenOrder(orderName, 5);
      } else {
        await pages.shopifyAdmin.navigateToOrdersList(storeName);
        await pages.shopifyAdmin.openOrderFromOrdersList(orderName, 5);
      }

      await pages.shopifyAdmin.openMoreActions();
      await pages.shopifyAdmin.clickOnAutoLabelGeneration();
      await pages.labelFailureValidations.openShippingGrid();
      await pages.labelFailureValidations.waitForOrderToReachFinalState(orderName, 10);
      return;
    } catch (error) {
      lastError = error as Error;
      if (attempt === 3) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error(`Failed to auto-generate label for ${orderName}`);
}

test.describe('Validate label failure error message', { tag: '@regression' }, () => {
  let sharedOrderName: string;
  let sharedOrderId: string;
  let orderUploader: ShopifyOrderUploader;

  test.beforeAll(async () => {
    orderUploader = new ShopifyOrderUploader();

    const orderName = await orderUploader.uploadOrderWithAddresses({
      shippingAddress: {
        street: '2 Guildford Road',
        city: 'LN',
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
    sharedOrderName = orderName as string;
    sharedOrderId = String(orderUploader.getLastOrderId());

    expect(sharedOrderId).toBeTruthy();
    console.log(`Created order: ${sharedOrderName} (${sharedOrderId})`);
  });

  test('Verify short city auto-label failure modal and request payload', async ({ pages }) => {
    test.setTimeout(180000);

    await triggerAutoGenerateLabelWithRetry(pages, store, sharedOrderName);

    await pages.labelFailureValidations.openOrderFailureMessage(sharedOrderName);
    const failureInfo = await pages.labelFailureValidations.getFailureDialogDetails();

    expect(failureInfo.code).toBe('CITY.TOO.SHORT');
    expect(failureInfo.message).toContain('City name is too short. Please provide the full city name.');
    expect(failureInfo.resolution).toContain('support@pluginhive.com');

    //Open View link
    await pages.labelFailureValidations.openRequestResponseXmlView();
    const { request, response } = await pages.labelFailureValidations.getRequestResponsePayload();

    const requestedShipment = (request.requestObject as Record<string, unknown>)?.requestedShipment as Record<string, unknown>;
    const recipients = requestedShipment?.recipients as Array<Record<string, unknown>> | undefined;
    const address =
      (recipients?.[0]?.address as Record<string, unknown> | undefined) ??
      ((requestedShipment?.recipient as Record<string, unknown> | undefined)?.address as Record<string, unknown> | undefined);
    const responsePayload = response.jsonResponse as Record<string, unknown>;
    const errors = responsePayload?.errors as Array<Record<string, unknown>>;

    expect(address?.city).toBe('LN');
    expect(address?.postalCode).toBe('GU21 2MY');
    expect(address?.countryCode).toBe('GB');
    expect(response.status).toBe(400);
    expect(errors?.[0]?.code).toBe('CITY.TOO.SHORT');
  });
});
