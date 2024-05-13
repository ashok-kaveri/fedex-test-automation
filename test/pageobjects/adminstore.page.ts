import moment from 'moment';
import 'moment-timezone';
import Page from './page.ts';
import { Status } from 'allure-js-commons';
import allure from '@wdio/allure-reporter';

const compareArrays = (a: any, b: any) => {
    const setA = new Set(a);
    const setB = new Set(b);
    return [...setA].every(value => setB.has(value)) && [...setB].every(value => setA.has(value));
};
   


class Store extends Page {

    public get  inputStore() {
        return $('//*[@id="PolarisTextField1"]')
    }

    public get selectStoreButton() {
        return $('//*[@id="70766821696"]/div/div/div/div')
    }

    public get loginButton() {
        return $('//*[@id="AppFrameMain"]/header/div[1]/div[2]/div/a')
    }

    public get onlineStoreButton() {
        return $('//*[@id="AppFrameNav"]/div/nav/div[2]/ul/li[1]/ul/li/ul/li/div[1]/div/a')
    }

    public get viewStoreButton() {
        
        return $('//*[@id="app"]/div[1]/div[2]/div/div[1]/div[2]/div/div[2]/div/div/div[2]/div/a')
    }

    public get storeIframe() {
        return $('iframe[title="Online Store"]');
    }

    public get appButton() {
        return $('/html/body/div[1]/div[1]/div/div/div[3]/div/div/nav/div[2]/ul/li[2]/div[1]/button')
    }

    public get App() {
        return $('//*[@id="app-search-result-gid://shopify/AppInstallation/648429535552"]/a/div/div[2]/div')
    }

    public get rateLogs() {
        return $('//*[@id=":r1b:"]/ul/li[6]/div/div/a/span/span')
    }
    public async appIframe()  {
        const { APP_IFRAME }  = process.env;     
        return $(`iframe[title="${APP_IFRAME}"]`);
    }

    public get ratesRequest() {
        return $('//textarea[contains(text(),"request")]')
    }

    // public viewXmlButton(id: string) {
    //     await $('//*[@id=`${id}]/td[4]/span/button')
    // }

    public get getRatesTables() {
        return $('//*[@id="AppFrameMain"]/div/div/div/div[2]/div[2]/div/div[2]/div[1]/div[1]/div[2]/table/tbody')
    }

    public async getTableFirstRow() {
        const rateTable = await this.getRatesTables
        const rows =  await rateTable.$$('tr');
        const cols = await rows[0].getText();
        const [date, requestId, ...otherProperties] = cols.split(/\n/);
        return { date , requestId };
    }


    public async select(store: string) {
        (await this.inputStore).setValue(store);
        await this.selectStoreButton.click();
    }

    public async login() {
        await this.loginButton.click();
    }

    private async switchIframe() {
        await browser.pause(8000);
        await browser.waitUntil(async () => {
            const element = await this.appIframe();
            return element.isDisplayed();
        }, { timeout: 10000, timeoutMsg: "Iframe not loaded within 10 seconds" });
        await browser.switchToFrame(await this.appIframe());
    }

    private checkForEqualityFor(product: any, items: any, productIds: any) {
        console.log('productIds: ', productIds);
        console.log('product', product);
        console.log('items', items);
        if(productIds) {
            return compareArrays(product.productIds, productIds);
        }

        const { length, width, height, weight, packagingType } = product;
        const { length: itemLength, width: itemWidth, height: itemHeight, weight: itemWeight, packaging_type: itemPackagingType } = items;
        const isPackingType = itemPackagingType ? (packagingType == itemPackagingType) : true;
        return (Number(length) === Number(itemLength)) && (Number(weight) === Number(itemWeight)) 
        && (Number(width) === Number(itemWidth)) && (Number(height) === Number(itemHeight)) && isPackingType

    }

    private async  getProductDimensionFrom(response: any) {
        console.log('JSON:::: ', response);
        console.log('response',JSON.stringify(response));
        const { CARRIER }  = process.env;
        if(CARRIER === "AU-POST") {
            

            const { request: { shipments , request: { shipments: fastRatesShipments=[] }={}} } = response
            console.log('fastRatesShipments: ', fastRatesShipments);
            console.log('shipments',shipments);
            if(fastRatesShipments.length>0) {
                return fastRatesShipments[0].items[0];
            }
            return shipments[0].items[0];   
        }else if(CARRIER === "MYPOST") {
            const { request: { shipments , request: { shipments: fastRatesShipments=[] }={}} } = response
            if(fastRatesShipments.length>0) {
                return fastRatesShipments[0].items[0];
            }
        }
        const { request: { items } } = response
        return items[0];
    }

    private async verifyRatesRequestId(requestId: string, product: any, orderId: string) {
         (await $(`//*[@id="${requestId}"]/td[4]/span/button`)).click();
        const xml =  await $('//textarea');
        console.log('JSON.parse((await xml.getText())): ', JSON.parse((await xml.getText())));
        const description =  orderId + "  rateLog Id  " + requestId
        const { shipments, headers } = JSON.parse((await xml.getText()))
        allure.addDescription(description, 'text');
        if(shipments || headers) {
            throw new Error('Rate unavailable');
        }
        const { features, product_ids, ...itemToCompare } = await this.getProductDimensionFrom(JSON.parse((await xml.getText())));
        const isEqual = this.checkForEqualityFor(product , itemToCompare, product_ids);      
        console.log('isEqual: ', isEqual);
        if(isEqual) {
            return;
        }
        throw new Error('Product details mismatch');
    }

    private async isRatesRequestValidFor(date: string) {
        const dateAsString = new Date(date.slice(0, 14)).setFullYear(new Date().getFullYear())
        const dateFromRateLog = moment(dateAsString).tz("Asia/Kolkata").format('DD MMM yyyy HH:mm');
        const dateRateLog = moment(dateFromRateLog).tz("UTC");
        console.log('now: ', dateRateLog, "UTC", moment().tz("UTC"));
        const diff = moment().tz("UTC").diff(dateRateLog, 'minute')
        return diff > 5 ? false : true;
    }

    private async verifyRatesFor(product: any, orderId: string) {
       const { date, requestId} = await this.getTableFirstRow();
       if(!this.isRatesRequestValidFor(date)) {
            throw new Error('Invalid rate request')
       }

       await this.verifyRatesRequestId(requestId, product, orderId)
    }   

  
    public async verifyRatesLog( product: any, orderId) {
        const { STORE_ID, APP }  = process.env;        
        const storeId = STORE_ID.match(/^(.*?)\.myshopify\.com/)[1];
        console.log(orderId);
        await browser.pause(2000)
        await this.open(`admin.shopify.com/store/${storeId}/apps/${APP}/rateslog`);
        await this.switchIframe();
        await this.verifyRatesFor(product, orderId);
        await browser.pause(10000)
     }
}


export default new Store();
