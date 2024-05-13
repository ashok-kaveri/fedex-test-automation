import Page from "./page.ts";


class OnlineStore extends Page {

    public get catalogLink() {
        return $('//*[@id="shopify-section-header"]/sticky-header/header/nav/ul/li[2]/a')
    }

    public async catalog() {
        await this.waitTillClickable(await this.catalogLink);
        (await this.catalogLink).click();
    };
};

export default new OnlineStore; 