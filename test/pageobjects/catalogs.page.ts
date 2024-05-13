import Page from "./page.ts";


class CatalogsPage extends Page {

    public get addToCartButton() {
        return $('Button[name="add"]')
    }

    public get cartUrl() {
        return this.open('alwin-test-store.myshopify.com/cart')
    }

    public get checkoutButton() {
        return $('//*[@id="checkout"]')
    }


    public async viewProduct(productSelector: string, store: string) {          
        await this.open(`${store}/products/${productSelector}`);
    }   

    public async buyProducts() {
        await this.cartUrl;
        await this.waitTillClickable(await this.checkoutButton);
        await this.checkoutButton.click();
    }
}



export default new CatalogsPage();