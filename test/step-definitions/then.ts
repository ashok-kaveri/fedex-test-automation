import { Given, When, Then } from '@wdio/cucumber-framework';
import { expect, $ } from '@wdio/globals';

import LoginPage from '../pageobjects/login.page.ts';
import AccountsPage from '../pageobjects/shopifyAccounts.page.js';
import checkoutPage from '../pageobjects/checkout.page.js';
import Registration from '../pageobjects/registrationPage.ts';
import allure from '@wdio/allure-reporter';
import fs from 'fs';
import { ErrorHandler } from './ErrorHandler.js';


const pages = {
    login: LoginPage
}


Then(/^I should be on page with (.*)$/, async (title) => {
    await expect(await AccountsPage.title).toBe(title)
});


Then('I should be redirected to the dashboard', async () => {
    await expect(browser).toHaveUrl(expect.stringContaining('/stores'));
});


Then('I should be redirected to account', async () => {

    console.log('URL: ', await browser.getUrl());    
    await expect(browser).toHaveUrl(expect.stringContaining('/settings/account/additional'));
});

Then('I should be deleting the account for test {string}', async (testId: string) => {
    try {
        const errorMessage: string | undefined = await Registration.extractErrorMessage(); 
        if(errorMessage && errorMessage.trim() !== '') {
            await new ErrorHandler().onError(new Error(errorMessage), testId);
        } else {
            console.log('No error message found. Skipping error handling.');
        }
        const url = await browser.getUrl();
        if (!url.includes('new')) {
        await Registration.waitForDynamicUrl(); 
        await Registration.delete();
        console.log('Account deleted successfully!');
        }
    } catch (error) {
        await new ErrorHandler().onError(error, testId);
    }
});

  

