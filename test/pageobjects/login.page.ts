import Page from './page.ts';

/**
 * sub page containing specific selectors and methods for a specific page
 */
class LoginPage extends Page {
    /**
     * define selectors using getter methods
     */
    public get inputEmail () {
        return $('//*[@id="account_email"]');
    }

    public get inputPassword () {
        return $('//*[@id="account_password"]');
    }

    public get btnLogin () {
        return $('//*[@id="login_form"]/div[2]/div[4]/button');
    }

    public get btnContinue () {

        // return $('//*[@id="account_lookup"]/div[5]/button');
        return $('//*[@id="account_lookup"]/div[5]/button/span/span[1]');
    }

    public get btnRequestLogin () {
        return $('//*[@id="ShopifyMainNav"]/ul[2]/li[2]/a')
    }

    public async requestLogin () {
        await this.waitTillClickable(await this.btnRequestLogin);
        (await this.btnRequestLogin).click();
    }

    public async continueWithEmail (email: string) {
        await (await this.inputEmail).setValue(email);
        (await this.btnContinue).click();
    }

    public async login (password: string) {
        await this.waitTillClickable(await this.inputPassword)
        await this.inputPassword.setValue(password);
        await this.btnLogin.click();
    }

    public open (store: string) {
        return super.open(`admin.shopify.com/store/${store}`);
    }
}
export default new LoginPage();
