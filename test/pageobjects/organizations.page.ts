import Page from "./page.ts";

class Organization extends Page {

    public get button () { 
        return $('/html/body/div[1]/main/section/div/div/ul/li[2]/a') 
    }

    public async selectAccount () {
        (await this.button).click();
    }
    
}

export default new Organization();
