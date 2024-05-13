import Page from "./page.ts";



class Products extends Page {

   public get buyButton() {
        return $('Button[data-testid="Checkout-button"]');
   }

   public async buy() {
    await this.waitTillClickable(await this.buyButton);
    (await this.buyButton).click();
   }
}


export default new Products();