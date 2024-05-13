/**
* main page object containing all methods, selectors and functionality
* that is shared across all page objects
*/
export default class Page {
    /**
    * @param url; 
    */
    // lookup
    public open (url: string) {
        return browser.url(`https://${url}`)
    }

    public async waitTillClickable(htmlElement: any ) {
        await browser.waitUntil(async () => {
            const element = await htmlElement;
            return element.isClickable();
        }, { timeout: 30000, timeoutMsg: 'Element not clickable within 10 seconds' });
    }
}
