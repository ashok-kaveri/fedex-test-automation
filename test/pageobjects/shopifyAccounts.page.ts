import { ChainablePromiseElement } from 'webdriverio';

import Page from './page.ts';

/**
 * sub page containing specific selectors and methods for a specific page
 */
class AccountsPage extends Page {
    /**
     * define selectors using getter methods
     */
   
     public get select() {
      return $('//*[@id="body-content"]/div[2]/div/div[2]/div/div/div/div[2]/div/div[3]/a[1]')
     }
   
     public get title() {
        return browser.getTitle();
     }

     public async selectAccount() {
       const windowHandles = await browser.getWindowHandles();
       const secondTabHandle = windowHandles[1];
       await browser.switchToWindow(secondTabHandle);
       await this.waitTillClickable(await this.select);
       (await this.select).click();
     }


}

export default new AccountsPage();
