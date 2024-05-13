import { Given, When, Then } from '@wdio/cucumber-framework';

import LoginPage from '../pageobjects/login.page.ts';
import AccountsPage from '../pageobjects/shopifyAccounts.page.js';
import Organizations from '../pageobjects/organizations.page.js';
import StoreLogin from '../pageobjects/shortLogin.page.js'


const pages = {
    login: LoginPage,
    organizations: Organizations,
    storeLogin: StoreLogin
}

Given(/^I am on the (\w+) page$/, async (page) => {
    await pages[page].open()
});

Given('I am on the storeLogin page of store', async () =>{
    const { STORE_ID }  = process.env;
    console.log('STORE_ID: ', STORE_ID);
    await StoreLogin.open(STORE_ID);
})

Given('I am on the login page of store', async () =>{
    const { STORE_ID }  = process.env;
    const storeId = STORE_ID.match(/^(.*?)\.myshopify\.com/)[1];
    console.log('storeId: ', storeId);
    await LoginPage.open(storeId);
})
