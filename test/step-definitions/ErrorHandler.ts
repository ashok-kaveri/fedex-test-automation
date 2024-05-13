import allure from '@wdio/allure-reporter';
import fs from 'fs';
export class ErrorHandler {
   async onError(error, testId) {
        console.log('error', error.message);
        const screenshotPath = `test/reports/allure-results/${testId}.png`
        await browser.saveScreenshot(screenshotPath);
        allure.addDescription(error.message,'text');
        allure.addAttachment(testId, Buffer.from(fs.readFileSync(screenshotPath)), 'image/png');
        throw error;
    }
}