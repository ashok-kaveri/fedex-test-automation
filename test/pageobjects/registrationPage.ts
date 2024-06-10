import Page from "./page.ts";


class Registration extends Page {

    public get addAccountButton() {
        return $('//*[@id="AppFrameMain"]/div/div/div/div[2]/div[2]/div/div[1]/div/div/div/div/div[2]/div/div/div/div[1]/button')
    }
    public get inputAccountName() {
        return $('//*[@id="accountName"]');
    }
    public get inputAccountNumber() {
        return $('//*[@id="accountNumber"]');
    }

    public get inputFirstName() {
        return $('//*[@id="firstName"]');
    }

    public get inputLastName() {
        return $('//*[@id="lastName"]');
    }

    public get inputCompanyName() {
        return $('//*[@id="companyName"]');
    }

    public get inputPhone() {
        return $('//*[@id="phoneNumber"]');
    }

    public get inputEmail() {
        return $('//*[@id="email"]');
    }

    public get inputStreet() {
        return $('//*[@id="street"]');
    }
    public get inputCountry() {
        return $('//*[@id="country"]');
    }

    public get inputCity() {
        return $('//*[@id="city"]');
    }
    public get inputZipCode() {
        return $('//*[@id="zipCode"]');
    }
    public get inputState() {
        return $('//*[@id="state"]');
    }

    public get inputShipToCountries() {
        return $('//*[@id="react-select-2-input"]');
    }

    public get registerButton() {
        return $('//*[@id="AppFrameMain"]/div/div/div/div[2]/div[1]/div/div/div[3]/div/div/button');
    }
    public get deleteButton() {
        const DELETE_BUTTON_ID = '#delete-account-button';
        browser.waitUntil(() => {
            return $(DELETE_BUTTON_ID).isDisplayed();
        }, {
            timeout: 5000,
            timeoutMsg: 'Delete button did not appear within 5 seconds'
        });
        return $(DELETE_BUTTON_ID);
    }
    public get deleteConfirmationMessage() {
        return $('//*[@id="resetConfirmation"]');
    }
    public get deleteConfirmationButton() {
        return $('//*[@id="PolarisPortalsContainer"]/div[2]/div[1]/div/div/div/div[1]/div[3]/div/div/div[2]/button[2]');
    }




    public async appIframe() {
        const { APP_IFRAME } = process.env;
        return $(`iframe[title="${APP_IFRAME}"]`);
    }

    public open() {
        const { STORE_ID, APP } = process.env;
        const storeId = STORE_ID.match(/^(.*?)\.myshopify\.com/)[1];
        // return super.open(`admin.shopify.com/store/${storeId}/apps/testing-553/settings/account/additional/new`);
        return super.open(`admin.shopify.com/store/${storeId}/apps/${APP}/settings/account/additional/new`);
    } 
    public async addADetails(table) {
        try{
            console.log('__________________________________________');
            const details = table.rows().map(row => ({
                accountName: row[0],
                accountNumber: row[1],
                firstName: row[2],
                lastName: row[3],
                companyName: row[4],
                phone: row[5],
                email: row[6],
                street: row[7],
                country: row[8],
                city: row[9],
                zip: row[10],
                state: row[11],
                shipTo: row[12],
    
            }));
    
            console.log('details', details);
    
            await browser.waitUntil(async () => {
                const element = await this.appIframe();
                return element.isDisplayed();
            }, { timeout: 10000, timeoutMsg: "Iframe not loaded within 10 seconds" });
            await browser.switchToFrame(await this.appIframe());
            browser.pause(15000);
            console.log('details',details[0].accountName);
            await (await (this.inputAccountName)).setValue(details[0].accountName);
            await (await (this.inputAccountNumber)).setValue(details[0].accountNumber);
            await (await (this.inputFirstName)).setValue(details[0].firstName);
            await (await (this.inputLastName)).setValue(details[0].lastName);
            await (await (this.inputCompanyName)).setValue(details[0].companyName);
            await (await (this.inputPhone)).setValue(details[0].phone);
            await (await (this.inputEmail)).setValue(details[0].email);
            await (await (this.inputStreet)).setValue(details[0].street);
            await (await (this.inputCountry)).selectByVisibleText(details[0].country);
            await (await (this.inputCity)).setValue(details[0].city);
            await (await (this.inputZipCode)).setValue(details[0].zip);
            await this.inputState.isExisting()? await (await (this.inputState)).selectByVisibleText(details[0].state):null;
            browser.pause(5000);
            if(await this.inputState.isExisting()){
                await (await (this.inputShipToCountries)).setValue(details[0].shipTo);
            }else{
                browser.pause(5000);
                await (await (this.inputShipToCountries)).setValue(details[0].shipTo);
            }
                const optionToSelect = await $('div[class$="-option"]');
                await optionToSelect.click();
        
        }catch(e){
            throw new Error(e);
        }


    }
    public async extractErrorMessage() {
        const bannerDiv = await $('div.Polaris-Page > div > div.Polaris-Banner.Polaris-Banner--withinPage');
        const isBannerDisplayed = await bannerDiv.isDisplayed();
        if (isBannerDisplayed) {
            const blockStack = await bannerDiv.$('div.Polaris-InlineStack > div.Polaris-Box > div.Polaris-BlockStack');
            const messageParagraph = await blockStack.$('div > p');
            const errorMessage = await messageParagraph.getText();
            console.log('error message!............................................................................', errorMessage);
            return errorMessage;
        }
       
    }
    
    public async waitForDynamicUrl(timeout: number = 20000) {
        await browser.waitUntil(
            async () => {
                const currentUrl = await browser.getUrl();
                return !currentUrl.includes('new');
            },
            {
                timeout,
                timeoutMsg: 'URL did not match the expected format within the timeout period'
            }
        );
    }
    public async register(){
        // await browser.switchToParentFrame();
        await (await (this.registerButton)).click();
        await browser.pause(10000);

    }
    public async delete(){
        browser.pause(5000);
        await this.waitTillClickable(await this.deleteButton);
        await (await (this.deleteButton)).click();
        await (await (this.deleteConfirmationMessage)).setValue("Permanently Delete");
        await this.waitTillClickable(await this.deleteConfirmationButton);
        await (await (this.deleteConfirmationButton)).click();
        await browser.pause(1000);


    }

}


export default new Registration;