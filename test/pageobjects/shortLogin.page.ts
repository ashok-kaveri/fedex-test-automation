import Page from "./page.ts";



class StoreLogin extends Page {

    public get passwordField() {
        return $('//*[@id="password"]')
    }

    public get submitButton () {
        return $('/html/body/div/div[2]/div[2]/form/button')
    }

    public async enterPassword(password: string) {
        (await this.passwordField).setValue(password);
    }

    public async enterStore() {
        (await this.submitButton).click();
    }

    public open (store: string) {
        return super.open(`${store}/collections/all`);
    }
    public openUrl (store: string) {
        return super.open(store);
    }
}


export default new StoreLogin;