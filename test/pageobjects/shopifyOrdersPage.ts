
import Page from "./page.ts";



class ShopifyOrders extends Page {

    public get orderTableBody () {
        return $('//*[@id="AppFrameMain"]/div/div[1]/div[2]/div/div[2]/div/div/div[2]/div/div/div/div/div[3]/table/tbody')
    }

    // public async selectOrderElement(id:string) {
    //     return $(`input[id="Select-${id}"]`)
    // }
    
    private async autoGenerateLabelFor(orderId) {
        const { STORE_ID }  = process.env;        
        const storeId = STORE_ID.match(/^(.*?)\.myshopify\.com/)[1];     
        const url= `admin.shopify.com/store/${storeId}/apps/aupost-qa/api/v1/labels/auto?shop=${STORE_ID}&ids%5B%5D=${orderId}`
        console.log('url: ', url);
        await this.open(url)
        await browser.pause(5000)
    }

    public async selectOrder() {
        const { STORE_ID }  = process.env;        
        const storeId = STORE_ID.match(/^(.*?)\.myshopify\.com/)[1];
        await this.open(`admin.shopify.com/store/${storeId}/orders`);
        await this.waitTillClickable(await this.orderTableBody);
        const orderTable = await this.orderTableBody;
        const rows =  await orderTable.$$('tr');
        const id = await rows[0].getAttribute('id');
        
        // (await this.selectOrderElement(id)).click();
        const orderId = id.match(/\/(\d+)$/)[1];
        await this.autoGenerateLabelFor(orderId)
     
    } 
}



export default new ShopifyOrders;