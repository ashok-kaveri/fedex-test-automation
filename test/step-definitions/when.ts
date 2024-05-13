import { Given, When, Then, Before, After } from '@wdio/cucumber-framework';
import { expect, $ } from '@wdio/globals'
import _ from 'lodash';

import LoginPage from '../pageobjects/login.page.ts';
import AccountsPage from '../pageobjects/shopifyAccounts.page.ts';
import OrganizationsPage from '../pageobjects/organizations.page.ts';
import StorePage, { any } from '../pageobjects/adminstore.page.ts';
import OnlineStorePage from '../pageobjects/onlineStore.page.ts';
import CatalogsPage from '../pageobjects/catalogs.page.ts';
import ProductsViewPage from '../pageobjects/productsView.page.ts';
import checkoutPage from '../pageobjects/checkout.page.ts';
import StoreLogin from '../pageobjects/shortLogin.page.ts';
import ShopifyOrders from '../pageobjects/shopifyOrdersPage.ts';
import shortLoginPage from '../pageobjects/shortLogin.page.ts';
import Registration from '../pageobjects/registrationPage.ts';
import { ErrorHandler } from './ErrorHandler.js';
import { AccountRegistrationDetailsError } from '../pageobjects/AccountRegistrationDetailsError.js';



const pages = {
    login: LoginPage
}

When('I log into shopify', async () => {
    await LoginPage.requestLogin();
})

When('I log into shopify store using password', async () => {
    const { STORE_PASSWORD }  = process.env;
    await StoreLogin.enterPassword(STORE_PASSWORD);
    await StoreLogin.enterStore();
})

When('I enter the email as {string}',  async (email: string) => {
     await LoginPage.continueWithEmail(email);
});

When('I enter the password as {string}', async (password: string) => {
    await LoginPage.login(password);
});

When('I select account as pluginhiveInternal', async () => {
    await OrganizationsPage.selectAccount()
})

When(/^I search for "(.*)" and select store$/, async (store: string) => {
    await StorePage.select(store);
})

When('I log in to store', async () => {
    await StorePage.login();
})

When('I choose login account', async () => {
    await AccountsPage.selectAccount();
})


When('I select on the catalog to view all my products', async () => {
    await OnlineStorePage.catalog();
})


When(/^I view the details of product using "(.*)" for store$/, async (productSelector: string) => {
    console.log('productSelector: ', productSelector);
    const { STORE_ID }  = process.env;
    console.log('STORE_ID: ', STORE_ID);
   await CatalogsPage.viewProduct(productSelector, STORE_ID);
})

When('I buy my product', async () => {
    await browser.pause(10000);
    await ProductsViewPage.buy();
})


When(/^I am on checkout, I enter my "(.*)" my first name "(.*)" and "(.*)" and "(.*)"$/, async (email: string, firstName: string, lastName: string, country: string) => {
    await checkoutPage.enterCustomerDetails(email, country, firstName, lastName );
})

When('I enter my address {string}', async (address: string) => {
    await checkoutPage.enterAddress(address);
    browser.pause(10000);
});

When("I select my service as {string}", async (service: string) => {
     await checkoutPage.selectServiceByName(service)
     browser.pause(10000);
})


When("I enter my credit card details", async () => {
    await checkoutPage.enterPaymentDetails();
    browser.pause(5000);
})

When('I confirm payment', async() => {

    await checkoutPage.makePayment();
})

Then('I should see my orderId', async function () {
    Before(function() {
        this.orderId = undefined
    })
    const orderId = await checkoutPage.getOrderId();
    this.orderId = orderId;
    console.log('this.orderId:::: ', this.orderId);
    await expect(orderId).toContain('Order')
});


// When(/^I click on rates logs for "(.*)" and "(.*)" and "(.*) and verify "(.*)" "(.*)" "(.*)" "(.*)"$/,async (app: string, store: string, iframe: string, productWeight: number, productLength: number, productWidth: number, productHeight: number) => {
//     console.log('store: ', store);
//     console.log('app: ', app);
//     await StorePage.verifyRatesLog(app, store, iframe, { weight: productWeight, height: productHeight, width: productWidth , length: productLength });
// })

When('I buy my products which are in cart', async function() {
    await CatalogsPage.buyProducts();
})

// Then('I should see my orderId', async () => {
//     const orderId = await checkoutPage.getOrderId();
//     console.log('this.orderId;: ', this.orderId = "3234242");
//     await expect(orderId).toContain('Order')
// });

When('I click on rates logs for app and store and verify the product dimensions', async function (table) {
    await browser.pause(5000);    
    const products = table.rows().map(row => ({
        weight: row[0],
        length: row[1],
        width: row[2],
        height: row[3],
        ...(row[4] ? { packagingType: row[4] } : {}),
        ...(row[5] ? { productIds: row[5].split(',') } : {})
    }));
    await StorePage.verifyRatesLog({ ...products[0] }, this.orderId);
 
});

When(/^I click on rates logs for app and store and verify my post the "(.*)"$/, async function(productIds: string) {
    console.log('productIds: ', productIds);

    
    await StorePage.verifyRatesLog({ productIds: productIds.split(',') }, this.orderId);
})

When('I want to generate label for the order', async function () {
    await ShopifyOrders.selectOrder();
    return;

})
When('i\'m on the registration page', async function () {
    // await browser.pause(2000)
    await Registration.open();
    await browser.pause(8000)

})

When('I registration add details {string}', async function (testId,table) {
    try{
        await Registration.addADetails(table);
        await browser.pause(8000)
    } catch(e) {
     await new ErrorHandler().onError(e,testId);   
    }
})

When('I click register', async function () {
    await Registration.register();

})



