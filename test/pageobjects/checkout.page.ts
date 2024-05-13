import { getTagName } from "webdriverio/build/commands/element.js";
import Page from "./page.ts";
import allure from '@wdio/allure-reporter'


class Checkout extends Page {

    public get inputEmail() {
        return $('//*[@id="email"]')
    }
    
    public get selectField() {
        return $('Select[name="countryCode"]')
    }

    public get firstNameField() {
        return $('Input[name="firstName"]')
    }

    public get lastNameField() {
        return $('Input[name="lastName"]')
    }

    public get addressField() {
        return $('//*[@id="shipping-address1"]')
    }

    public get addressList() {
        return $('//*[@id="shipping-address1-options"]')
    } 


    public get selectAddress() {
        return $('//*[@id="shipping-address1-option-1"]')
    }

    public get shippingMethodField() {
        return $('//*[@id="shipping_methods"]')
    }

    public get cardNumberField() {
        return $('//*[@id="number"]')
    }

    public get cardExpirationField() {
        return $('#expiry')
    }

    public get cardSecurityField() {
        return $('//*[@id="verification_value"]')
    }

    public get cardExpiryMonth() {
        return $('//*[@id="expiry_month"]')
    }
    public get cardExpiryYear() {
        return $('//*[@id="expiry_year"]')
    }

    public get cardNoIframe() {
        return $('iframe[title="Field container for: Card number"]');

    }

    public get expiryIframe() {
        return $('iframe[title="Field container for: Expiration date (MM / YY)"]');

    }

    public get cvvIframe() {
        return $('iframe[title="Field container for: Security code"]');

    }

    public get payButton () {
        return $('/html/body/div[1]/div[1]/div/div/div[1]/div[2]/div[1]/div/main/div/form/div[1]/div/div/section[2]/div[2]/div/div[1]/div/div/div/div/div/div/button')
    }

    public get orderId () {
        return $("/html/body/div[1]/div/div/main/div[1]/div[1]/div[1]/div/div/span")
    }


    
    public async enterCustomerDetails(email: string, country: string, firstName: string, lastName: string) {
        await (await this.inputEmail).setValue(email);
        await (await this.selectField).waitForDisplayed();
        await (await this.selectField).waitForEnabled();
        await (await this.selectField).selectByAttribute('value', country)
   
        await browser.pause(1000);
        await (await this.firstNameField).waitForDisplayed();
        await (await this.firstNameField).waitForEnabled();
        await (await this.lastNameField).waitForDisplayed({interval: 150000});
        await (await this.lastNameField).waitForEnabled();
        await (await this.firstNameField).setValue(firstName);
        await (await this.lastNameField).setValue(lastName);

        await browser.pause(1000);
    }

    public async enterAddress(address: string) {
        await browser.pause(3000);
        await (await this.addressField).clearValue();
        await (await this.addressField).setValue(address);
        await browser.pause(5000);

        (await this.addressList).waitForExist();
        await (await this.selectAddress).click();
        await browser.pause(6000);
    }

    public async selectServiceByName(serviceName: string) {
        let serviceSelector = null;
          await browser.pause(10000);
          (await this.shippingMethodField).waitForDisplayed({ timeout: 20000});
          const element = await (await this.shippingMethodField).$$('p');
          console.log('tags: ', await element.forEach(async (ele) => {
          const elementText = await ele.getText();
         if(elementText === serviceName) {
            serviceSelector = await (await ele.parentElement().parentElement()).getAttribute('for')
            console.log('serviceSelector: ', serviceSelector);
            const selectService = await (await $(`//*[@id="${serviceSelector}"]`));
            selectService.click();
         }
    }));

    }

    public async enterPaymentDetails() {
        await browser.switchToFrame(await this.cardNoIframe);
        (await this.cardNumberField).setValue(1);
        await browser.pause(1000); 
        await browser.switchToParentFrame();
        await browser.switchToFrame(await this.expiryIframe);
        (await this.cardExpirationField).addValue(9);
        (await this.cardExpirationField).addValue(30);
        await browser.pause(1000); 
        await browser.switchToParentFrame();
        await browser.pause(1000); 
        await browser.switchToFrame(await this.cvvIframe);
        (await this.cardSecurityField).setValue(333);
        await browser.pause(3000); 
        await browser.switchToParentFrame();
    }

    public async  makePayment() {
        await browser.pause(10000);
        await this.waitTillClickable(await this.payButton);
        await this.payButton.click();
        await browser.pause(10000);
        browser.refresh();
        await browser.pause(6000);
    }

    public async getOrderId() {
        const orderId =  await (this.orderId).getText();
        allure.addDescription(`Generated OrderId For ${orderId}`, 'text')
        return orderId;
    }
};

export default new Checkout;